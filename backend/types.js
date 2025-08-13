const zod = require("zod");

const CreateUserInput = zod.object({
    username: zod.string(),
    password: zod.string()}
)

module.exports = {
    CreateUserInput
}