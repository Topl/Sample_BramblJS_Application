import { createRequire } from "module";
const require = createRequire(import.meta.url);

require("@babel/register");
require("dotenv").config();

export default "./src";
