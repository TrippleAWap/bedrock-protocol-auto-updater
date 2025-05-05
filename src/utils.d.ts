import { mcpe_packet } from "./output.ts";
declare module "bedrock-protocol" {
	interface Client {
		write: <T extends keyof mcpe_packet["params"]>(
			packetName: T,
			packetParams: mcpe_packet["params"][T]
		) => void;
		beforeWrite: <T extends keyof mcpe_packet["params"]>(
			packetName: T,
			packetParams: (packetParams: mcpe_packet["params"][T]) => mcpe_packet["params"][T] | void
		) => void;
		on: <T extends keyof mcpe_packet["params"]>(
			packetName: T,
			callback: (packetParams: mcpe_packet["params"][T]) => any
		) => void;
	}
}