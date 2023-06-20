const { default: mongoose } = require('mongoose')
const bcrypt = require("bcryptjs")

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        pic: {
            type: String,
            default: "https://cdn1.iconfinder.com/data/icons/user-pictures/100/unknown-512.png"
        },
    },
    {
        timestamps: true,
    }
);

userSchema.methods.matchPassword = async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);
}

userSchema.pre('save', async function (next) {
    if (!this.isModified) {
        next()
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})//before saving

const User = mongoose.model("User", userSchema)
module.exports = User;