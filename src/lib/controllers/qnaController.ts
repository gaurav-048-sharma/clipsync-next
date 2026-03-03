import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Question from '@/lib/models/questionModel';
import Answer from '@/lib/models/answerModel';
import mongoose from 'mongoose';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';

// ==================== QUESTIONS ====================

export async function getQuestions(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const tags = searchParams.get('tags');
    const subject = searchParams.get('subject');
    const status = searchParams.get('status') || 'open';
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (tags) { const tagArray = tags.split(',').map(t => t.trim().toLowerCase()); query.tags = { $in: tagArray }; }
    if (subject) query.subject = subject;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { body: { $regex: search, $options: 'i' } }, { tags: { $regex: search, $options: 'i' } }];

    let sortOption: any = {};
    switch (sort) {
      case 'oldest': sortOption = { createdAt: 1 }; break;
      case 'popular': sortOption = { views: -1 }; break;
      case 'unanswered': query.answerCount = 0; sortOption = { createdAt: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;
    const questions = await Question.find(query).populate('author', 'fullName profilePicture username').sort(sortOption).skip(skip).limit(limit);
    const total = await Question.countDocuments(query);

    return NextResponse.json({ success: true, questions, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to get questions' }, { status: 500 });
  }
}

export async function getQuestion(req: NextRequest, questionId: string) {
  try {
    await dbConnect();
    await verifyAuth(req);
    if (!mongoose.isValidObjectId(questionId)) return NextResponse.json({ success: false, message: 'Invalid question ID' }, { status: 400 });

    const question = await Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } }, { new: true }).populate('author', 'fullName profilePicture username').populate('acceptedAnswer');
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    const answers = await Answer.find({ questionId }).populate('author', 'fullName profilePicture username').populate('comments.author', 'fullName profilePicture username').sort({ isAccepted: -1, createdAt: -1 });

    return NextResponse.json({ success: true, question, answers });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to get question' }, { status: 500 });
  }
}

export async function createQuestion(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { title, body, codeSnippet, isAnonymous, tags, subject } = await req.json();
    if (!title || !body) return NextResponse.json({ success: false, message: 'Title and body are required' }, { status: 400 });

    const question = new Question({ author: authUser._id, title, body, codeSnippet: codeSnippet || null, isAnonymous: isAnonymous || false, tags: tags || [], subject: subject || 'General' });
    await question.save();
    const populated = await Question.findById(question._id).populate('author', 'fullName profilePicture username');
    return NextResponse.json({ success: true, message: 'Question posted successfully', question: populated }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to create question' }, { status: 500 });
  }
}

export async function updateQuestion(req: NextRequest, questionId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { title, body, codeSnippet, tags, subject } = await req.json();
    const question = await Question.findById(questionId) as any;
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    if (question.author.toString() !== authUser._id) return NextResponse.json({ success: false, message: 'You can only edit your own questions' }, { status: 403 });

    if (title) question.title = title;
    if (body) question.body = body;
    if (codeSnippet !== undefined) question.codeSnippet = codeSnippet;
    if (tags) question.tags = tags;
    if (subject) question.subject = subject;
    await question.save();

    const updated = await Question.findById(questionId).populate('author', 'fullName profilePicture username');
    return NextResponse.json({ success: true, message: 'Question updated', question: updated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to update question' }, { status: 500 });
  }
}

export async function deleteQuestion(req: NextRequest, questionId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const question = await Question.findById(questionId) as any;
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    if (question.author.toString() !== authUser._id) return NextResponse.json({ success: false, message: 'You can only delete your own questions' }, { status: 403 });
    await Answer.deleteMany({ questionId });
    await Question.findByIdAndDelete(questionId);
    return NextResponse.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to delete question' }, { status: 500 });
  }
}

export async function voteQuestion(req: NextRequest, questionId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { voteType } = await req.json();
    if (!['up', 'down'].includes(voteType)) return NextResponse.json({ success: false, message: 'Invalid vote type' }, { status: 400 });

    const question = await Question.findById(questionId) as any;
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    const hasUpvoted = question.upvotes.includes(authUser._id);
    const hasDownvoted = question.downvotes.includes(authUser._id);
    if (voteType === 'up') {
      if (hasUpvoted) question.upvotes.pull(authUser._id);
      else { if (hasDownvoted) question.downvotes.pull(authUser._id); question.upvotes.push(authUser._id); }
    } else {
      if (hasDownvoted) question.downvotes.pull(authUser._id);
      else { if (hasUpvoted) question.upvotes.pull(authUser._id); question.downvotes.push(authUser._id); }
    }
    await question.save();
    return NextResponse.json({ success: true, upvotes: question.upvotes.length, downvotes: question.downvotes.length, voteScore: question.upvotes.length - question.downvotes.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to vote' }, { status: 500 });
  }
}

export async function resolveQuestion(req: NextRequest, questionId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const question = await Question.findById(questionId) as any;
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    if (question.author.toString() !== authUser._id) return NextResponse.json({ success: false, message: 'Only the author can resolve' }, { status: 403 });
    question.status = question.status === 'resolved' ? 'open' : 'resolved';
    await question.save();
    return NextResponse.json({ success: true, message: `Question ${question.status === 'resolved' ? 'resolved' : 'reopened'}`, status: question.status });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to resolve question' }, { status: 500 });
  }
}

// ==================== ANSWERS ====================

export async function createAnswer(req: NextRequest, questionId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { body, codeSnippet, isAnonymous } = await req.json();
    if (!body) return NextResponse.json({ success: false, message: 'Answer body is required' }, { status: 400 });
    const question = await Question.findById(questionId) as any;
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    const answer = new Answer({ questionId, author: authUser._id, body, codeSnippet: codeSnippet || null, isAnonymous: isAnonymous || false });
    await answer.save();
    question.answerCount += 1;
    await question.save();
    const populated = await Answer.findById(answer._id).populate('author', 'fullName profilePicture username');
    return NextResponse.json({ success: true, message: 'Answer posted', answer: populated }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to post answer' }, { status: 500 });
  }
}

export async function updateAnswer(req: NextRequest, answerId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { body, codeSnippet } = await req.json();
    const answer = await Answer.findById(answerId) as any;
    if (!answer) return NextResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    if (answer.author.toString() !== authUser._id) return NextResponse.json({ success: false, message: 'You can only edit your own answers' }, { status: 403 });
    if (body) answer.body = body;
    if (codeSnippet !== undefined) answer.codeSnippet = codeSnippet;
    await answer.save();
    const updated = await Answer.findById(answerId).populate('author', 'fullName profilePicture username');
    return NextResponse.json({ success: true, answer: updated });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to update answer' }, { status: 500 });
  }
}

export async function deleteAnswer(req: NextRequest, answerId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const answer = await Answer.findById(answerId) as any;
    if (!answer) return NextResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    if (answer.author.toString() !== authUser._id) return NextResponse.json({ success: false, message: 'You can only delete your own answers' }, { status: 403 });
    await Question.findByIdAndUpdate(answer.questionId, { $inc: { answerCount: -1 } });
    await Question.findByIdAndUpdate(answer.questionId, { $unset: { acceptedAnswer: 1 } });
    await Answer.findByIdAndDelete(answerId);
    return NextResponse.json({ success: true, message: 'Answer deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to delete answer' }, { status: 500 });
  }
}

export async function voteAnswer(req: NextRequest, answerId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { voteType } = await req.json();
    if (!['up', 'down'].includes(voteType)) return NextResponse.json({ success: false, message: 'Invalid vote type' }, { status: 400 });
    const answer = await Answer.findById(answerId) as any;
    if (!answer) return NextResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    const hasUpvoted = answer.upvotes.includes(authUser._id);
    const hasDownvoted = answer.downvotes.includes(authUser._id);
    if (voteType === 'up') { if (hasUpvoted) answer.upvotes.pull(authUser._id); else { if (hasDownvoted) answer.downvotes.pull(authUser._id); answer.upvotes.push(authUser._id); } }
    else { if (hasDownvoted) answer.downvotes.pull(authUser._id); else { if (hasUpvoted) answer.upvotes.pull(authUser._id); answer.downvotes.push(authUser._id); } }
    await answer.save();
    return NextResponse.json({ success: true, upvotes: answer.upvotes.length, downvotes: answer.downvotes.length, voteScore: answer.upvotes.length - answer.downvotes.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to vote' }, { status: 500 });
  }
}

export async function acceptAnswer(req: NextRequest, answerId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const answer = await Answer.findById(answerId) as any;
    if (!answer) return NextResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    const question = await Question.findById(answer.questionId) as any;
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    if (question.author.toString() !== authUser._id) return NextResponse.json({ success: false, message: 'Only the question author can accept answers' }, { status: 403 });

    if (question.acceptedAnswer) await Answer.findByIdAndUpdate(question.acceptedAnswer, { isAccepted: false });
    if (question.acceptedAnswer?.toString() === answerId) { question.acceptedAnswer = null; answer.isAccepted = false; }
    else { question.acceptedAnswer = answerId; question.status = 'resolved'; answer.isAccepted = true; }
    await question.save();
    await answer.save();
    return NextResponse.json({ success: true, message: answer.isAccepted ? 'Answer accepted' : 'Answer unaccepted', isAccepted: answer.isAccepted });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to accept answer' }, { status: 500 });
  }
}

// ==================== COMMENTS ====================

export async function addAnswerComment(req: NextRequest, answerId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { text } = await req.json();
    if (!text || text.trim().length === 0) return NextResponse.json({ success: false, message: 'Comment cannot be empty' }, { status: 400 });
    const answer = await Answer.findById(answerId) as any;
    if (!answer) return NextResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    answer.comments.push({ author: authUser._id, text: text.trim() });
    await answer.save();
    const updated = await Answer.findById(answerId).populate('comments.author', 'fullName profilePicture username') as any;
    const newComment = updated.comments[updated.comments.length - 1];
    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to add comment' }, { status: 500 });
  }
}

export async function deleteAnswerComment(req: NextRequest, answerId: string, commentId: string) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const answer = await Answer.findById(answerId) as any;
    if (!answer) return NextResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    const comment = answer.comments.id(commentId);
    if (!comment) return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
    if (comment.author.toString() !== authUser._id) return NextResponse.json({ success: false, message: 'You can only delete your own comments' }, { status: 403 });
    answer.comments.pull(commentId);
    await answer.save();
    return NextResponse.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to delete comment' }, { status: 500 });
  }
}

// ==================== SEARCH & TAGS ====================

export async function searchQuestions(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    if (!q || q.trim().length < 2) return NextResponse.json({ success: false, message: 'Search query too short' }, { status: 400 });

    const skip = (page - 1) * limit;
    const questions = await Question.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } }).populate('author', 'fullName profilePicture username').sort({ score: { $meta: 'textScore' } }).skip(skip).limit(limit);
    const total = await Question.countDocuments({ $text: { $search: q } });
    return NextResponse.json({ success: true, questions, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to search questions' }, { status: 500 });
  }
}

export async function getTags(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const tags = await Question.aggregate([{ $unwind: '$tags' }, { $group: { _id: '$tags', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: limit }]);
    return NextResponse.json({ success: true, tags });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to get tags' }, { status: 500 });
  }
}

export async function getMyQuestions(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const questions = await Question.find({ author: authUser._id }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Question.countDocuments({ author: authUser._id });
    return NextResponse.json({ success: true, questions, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to get your questions' }, { status: 500 });
  }
}

export async function getMyAnswers(req: NextRequest) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const answers = await Answer.find({ author: authUser._id }).populate('questionId', 'title').sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Answer.countDocuments({ author: authUser._id });
    return NextResponse.json({ success: true, answers, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ message: err.message }, { status: err.status });
    return NextResponse.json({ success: false, message: 'Failed to get your answers' }, { status: 500 });
  }
}
