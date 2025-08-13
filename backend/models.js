const mongoose = require("mongoose");


const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correct: { type: Number, required: true }
});
const QuestionModel = mongoose.model('Question', QuestionSchema);


const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  isActive: { type: Boolean, default: true }
});
const QuizModel = mongoose.model('Quiz', QuizSchema);


const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});
const UserModel = mongoose.model('User', UserSchema);

const clientSchema=new mongoose.Schema({
   username: String,
  password: String
})
const ClientModel = mongoose.model('client', clientSchema);
module.exports = {
  UserModel,
  QuizModel,
  QuestionModel,
  ClientModel
};
