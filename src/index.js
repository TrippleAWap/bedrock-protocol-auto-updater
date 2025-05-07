// packets handled. all other packets will be ignored.
const NEEDED_PACKET_IDS = [
    3, // server_to_client_handshake
    2, // play_status
    6, // resource_packs_info
];

// allows us to overload packets so the client handles the packet the same except
// we ignore the data sent from the actually server.
// use case eg.
//// the packet `resource_packs_info` gets changed. we dont need any info.
//// we handle the packet the same way as the original packet but we ignore the data.
//// thus allowing us to ignore the packet structure and removing the need to update the packet!
const PACKET_OVERLOADS = {
    6: {
        name: 'resource_packs_info',
        params: {
            must_accept: false,
            has_addons: false,
            has_scripts: false,
            world_template: { uuid: '00000000-0000-0000-0000-000000000000', version: '0.0.0' },
            texture_packs: []
        }
    }
};

; (async () => {
    const { createClient, ping, Client } = require("bedrock-protocol");
    const { RealmAPI } = require("prismarine-realms");
    const { Authflow, Titles } = require("prismarine-auth");
    require("./utils")
    const auth = new Authflow("main", "tokens", { flow: 'live', authTitle: Titles.MinecraftNintendoSwitch }, (c) => {
        console.log(c.message);
    });
    console.time("auth");
    await auth.getXboxToken();
    console.timeEnd("auth");
    const realms = RealmAPI.from(auth, "bedrock")
    const target_realm = await realms.getRealmFromInvite("zmgr4pkb8ucys78");
    // const target_realm = await realms.getRealms().then(r => r.find(i => !i.expired && !i.expiredTrial && i.state == "OPEN"));
    console.log(target_realm.id);
    const { host, port } = await realms.getRealmAddress(target_realm.id);
    console.log(`${host}:${port}`);
    const pong = await ping({ host, port })
    console.log(pong)
    const client = createClient({
        authflow: auth,
        host,
        port,
        followPort: false,
    });

    // modify protocol params
    client.on("connect_allowed", () => {
        client.options.protocolVersion = pong.protocol;
        client.options.version = pong.version;
    })

    let login_packet;
    client.beforeWrite("login", (packet) => {
        login_packet = packet;

        // lets modify read packet here so we can ignore packets.
        const orig = Client.prototype.readPacket;
        client.readPacket = function (packet) {
            const packet_id = packet[0];
            if (!NEEDED_PACKET_IDS.includes(packet_id)) return;
            if (PACKET_OVERLOADS[packet_id]) {
                const { name, params } = PACKET_OVERLOADS[packet_id];
                this.emit(name, params)
                return;
            }
            // // if you're having troubles please uncomment the lines below and add packets to NEEDED_PACKET_IDS and PACKET_OVERLOADS if needed.
            // try {
            //     var des = this.deserializer.parsePacketBuffer(packet)
            // } catch { return };
            // const packet_data = { name: des.data.name, params: des.data.params }
            // console.log(packet_id, packet_data)
            return orig.call(this, packet)
        }
    })
    client.on("play_status", ({ status }) => {
        if (status !== 3) return;
        console.log("Client spawned")
    })

    // sigint trap; send another login packet to force server disconnect.
    process.on("SIGINT", async () => {
        const buffer = client.serializer.createPacketBuffer({ name: "login", params: login_packet })
        client.sendBuffer(buffer, true);
        await new Promise(r => setTimeout(r, 200));
        process.exit(0)
    })
})();
