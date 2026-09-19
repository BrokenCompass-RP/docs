const nextConfig = {
  // Preserve the repository's existing AGENTS.md instead of letting Next.js
  // append framework-generated agent instructions during local development.
  agentRules: false,
  // OAuth callbacks contain short-lived credentials in their query string.
  // Keep Next.js' development request logger from printing that route.
  logging: {
    incomingRequests: {
      ignore: [/^\/api\/auth\/discord\/callback(?:\?|$)/]
    }
  }
};

export default nextConfig;
