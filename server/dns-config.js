import dns from "dns";

// Node uses system DNS; some networks return ENOTFOUND for Neon (api.*.neon.tech).
// Public resolvers fix it without changing Windows adapter settings.
if (process.env.USE_PUBLIC_DNS !== "false") {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
}
