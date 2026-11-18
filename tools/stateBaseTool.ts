import { createMiddleware } from "langchain";

const stateBasedTools = createMiddleware({
    name: "StateBasedTools",
    wrapModelCall: (request, handler) => {
        // Read from State: check authentication and conversation length
        const state = request.state as typeof request.state & {
            authenticated?: boolean;
        };
        const isAuthenticated = state.authenticated ?? false;
        const messageCount = state.messages.length;

        let filteredTools = request.tools;

        // Only enable sensitive tools after authentication
        if (!isAuthenticated) {
            filteredTools = request.tools.filter(
                (t: any) => typeof t.name === "string" && t.name.startsWith("public_"),
            );
        } else if (messageCount < 5) {
            filteredTools = request.tools.filter(
                (t: any) => typeof t.name === "string" && t.name !== "advanced_search",
            );
        }

        return handler({ ...request, tools: filteredTools });
    },
});

export default stateBasedTools;
