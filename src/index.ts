import allIntents from "./services/intent.definition";
import { detectIntent } from "./services/intent.service";

const intentResult = detectIntent(allIntents,"hello")

export default intentResult;