import { createApp } from "vue";
import { LangChainPlugin } from "@langchain/vue";
import "./styles.css";
import App from "./App.vue";
import router from "./router";
import { AGENT_SERVER_URL } from "@/constants";

const app = createApp(App);
app.use(router);
app.use(LangChainPlugin, { apiUrl: AGENT_SERVER_URL });
app.mount("#app");
