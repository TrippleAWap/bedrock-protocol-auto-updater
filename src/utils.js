const bedrock_protocol = require("bedrock-protocol");

bedrock_protocol.Client.prototype.beforeWrite = function(packet_name, callback) {
    this.beforeWriteEvents ??= {};
    this.beforeWriteEvents[packet_name] ??= [];
    this.beforeWriteEvents[packet_name].push(callback);
}
const write_orig = bedrock_protocol.Client.prototype.write;
bedrock_protocol.Client.prototype.write = function(packet_name, packet_params) {
    this.beforeWriteEvents[packet_name]?.forEach(f => {
        const res = f(packet_params);
        if (!res) return;
        packet_params = res;
    });
    write_orig.call(this, packet_name, packet_params);
}
