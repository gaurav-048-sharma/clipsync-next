import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth, AuthError } from '@/lib/middleware/auth';
import UserProfile from '@/lib/models/userModel';
import { ensureProfile } from '@/lib/utils/ensureProfile';
import {
  InternshipExperience,
  Referral,
  ResumeReview,
  PrepGroup,
  MockInterview,
  UserKarma,
} from '@/lib/models/opportunityModel';

// Helper function to update karma
async function updateKarma(userId: string, field: string, points: number) {
  try {
    let karma = await UserKarma.findOne({ userId });
    if (!karma) {
      karma = new UserKarma({ userId });
    }

    (karma as any)[field] = ((karma as any)[field] || 0) + 1;
    karma.totalKarma = (karma.totalKarma || 0) + points;

    // Check for badges
    if (karma.resumesReviewed >= 10 && !karma.badges.find((b: any) => b.name === 'Resume Pro')) {
      karma.badges.push({ name: 'Resume Pro', earnedAt: new Date() });
    }
    if (karma.referralsGiven >= 5 && !karma.badges.find((b: any) => b.name === 'Referral Champion')) {
      karma.badges.push({ name: 'Referral Champion', earnedAt: new Date() });
    }
    if (
      karma.mockInterviewsConducted >= 10 &&
      !karma.badges.find((b: any) => b.name === 'Interview Guru')
    ) {
      karma.badges.push({ name: 'Interview Guru', earnedAt: new Date() });
    }

    await karma.save();
  } catch (err) {
    console.error('Update Karma Error:', err);
  }
}

const userPopulate = {
  path: 'userId',
  populate: { path: 'authId', select: 'username name' },
  select: 'authId profilePicture',
};

// ============ INTERNSHIP EXPERIENCES ============

export async function createExperience(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);

    const experience = new InternshipExperience({
      userId: userProfile._id,
      ...body,
    });

    await experience.save();
    await updateKarma(userProfile._id, 'questionsContributed', 5);

    const populated = await InternshipExperience.findById(experience._id).populate(userPopulate);

    return NextResponse.json(
      { message: 'Experience shared successfully', experience: populated },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Create Experience Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getExperiences(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');
    const role = searchParams.get('role');
    const location = searchParams.get('location');
    const year = searchParams.get('year');
    const sortBy = searchParams.get('sortBy');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: Record<string, any> = {};
    if (company) filter.company = new RegExp(company, 'i');
    if (role) filter.role = new RegExp(role, 'i');
    if (location) filter.location = location;
    if (year) filter.year = parseInt(year);

    let sort: Record<string, any> = { created_at: -1 };
    if (sortBy === 'rating') sort = { 'ratings.overall': -1 };
    if (sortBy === 'stipend') sort = { 'compensation.stipend': -1 };

    const experiences = await InternshipExperience.find(filter)
      .populate(userPopulate)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await InternshipExperience.countDocuments(filter);

    return NextResponse.json({
      experiences,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Experiences Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getExperience(req: NextRequest, id: string) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const experience = await InternshipExperience.findById(id)
      .populate(userPopulate)
      .populate({
        path: 'comments.userId',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      });

    if (!experience) {
      return NextResponse.json({ message: 'Experience not found' }, { status: 404 });
    }

    experience.views += 1;
    await experience.save();

    return NextResponse.json({ experience });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Experience Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function likeExperience(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const experience = await InternshipExperience.findById(id);

    if (!experience) {
      return NextResponse.json({ message: 'Experience not found' }, { status: 404 });
    }

    const likeIndex = experience.likes.indexOf(userProfile?._id);
    if (likeIndex > -1) {
      experience.likes.splice(likeIndex, 1);
    } else {
      experience.likes.push(userProfile?._id);
    }

    await experience.save();
    return NextResponse.json({ likes: experience.likes.length, isLiked: likeIndex === -1 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Like Experience Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function commentOnExperience(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const experience = await InternshipExperience.findById(id);

    if (!experience) {
      return NextResponse.json({ message: 'Experience not found' }, { status: 404 });
    }

    experience.comments.push({
      userId: userProfile?._id,
      text: body.text,
      isAnonymous: body.isAnonymous || false,
      created_at: new Date(),
    });

    await experience.save();

    const updated = await InternshipExperience.findById(id).populate({
      path: 'comments.userId',
      populate: { path: 'authId', select: 'username name' },
      select: 'authId profilePicture',
    });

    return NextResponse.json({ comments: updated?.comments });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Comment Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getSalaryStats(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');
    const role = searchParams.get('role');

    const filter: Record<string, any> = {
      'compensation.stipend': { $exists: true, $ne: null },
    };
    if (company) filter.company = new RegExp(company, 'i');
    if (role) filter.role = new RegExp(role, 'i');

    const stats = await InternshipExperience.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { company: '$company', role: '$role' },
          avgStipend: { $avg: '$compensation.stipend' },
          minStipend: { $min: '$compensation.stipend' },
          maxStipend: { $max: '$compensation.stipend' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgStipend: -1 } },
    ]);

    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Salary Stats Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ REFERRALS ============

export async function createReferral(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);

    const referral = new Referral({
      userId: userProfile._id,
      ...body,
    });

    await referral.save();

    const populated = await Referral.findById(referral._id).populate(userPopulate);

    return NextResponse.json(
      { message: 'Referral created successfully', referral: populated },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Create Referral Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getReferrals(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const company = searchParams.get('company');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: Record<string, any> = {};
    if (type) filter.type = type;
    if (company) filter.company = new RegExp(company, 'i');
    if (status) filter.status = status;

    const referrals = await Referral.find(filter)
      .populate(userPopulate)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Referral.countDocuments(filter);

    return NextResponse.json({
      referrals,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Referrals Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function applyForReferral(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const referral = await Referral.findById(id);

    if (!referral) {
      return NextResponse.json({ message: 'Referral not found' }, { status: 404 });
    }

    if (referral.type !== 'offer') {
      return NextResponse.json({ message: 'Can only apply to referral offers' }, { status: 400 });
    }

    const existingApplication = referral.applications.find(
      (app: any) => app.userId.toString() === userProfile?._id.toString()
    );
    if (existingApplication) {
      return NextResponse.json({ message: 'Already applied' }, { status: 400 });
    }

    referral.applications.push({
      userId: userProfile?._id,
      message: body.message,
      resumeUrl: body.resumeUrl,
      status: 'pending' as const,
      appliedAt: new Date(),
    });

    await referral.save();
    return NextResponse.json({ message: 'Application submitted successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Apply Referral Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function updateApplicationStatus(
  req: NextRequest,
  id: string,
  applicationId: string
) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const referral = await Referral.findById(id);

    if (!referral) {
      return NextResponse.json({ message: 'Referral not found' }, { status: 404 });
    }

    if (referral.userId.toString() !== userProfile?._id.toString()) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }

    const application = (referral.applications as any).id(applicationId);
    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    application.status = body.status;

    if (body.status === 'referred') {
      await updateKarma(userProfile?._id, 'referralsGiven', 10);
      await updateKarma(application.userId, 'referralsReceived', 5);
    }

    await referral.save();
    return NextResponse.json({ message: 'Application status updated' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Update Application Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ RESUME REVIEWS ============

export async function submitResume(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);

    const resumeReview = new ResumeReview({
      userId: userProfile._id,
      resumeUrl: body.resumeUrl,
      targetRole: body.targetRole,
      targetCompanies: body.targetCompanies,
      reviewType: body.reviewType,
      preferAlumniFrom: body.preferAlumniFrom,
    });

    await resumeReview.save();

    return NextResponse.json(
      { message: 'Resume submitted for review', resumeReview },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Submit Resume Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getPendingResumes(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const userProfile = await ensureProfile(user._id);

    const resumes = await ResumeReview.find({
      currentStatus: status,
      userId: { $ne: userProfile?._id },
    })
      .populate(userPopulate)
      .sort({ created_at: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ResumeReview.countDocuments({ currentStatus: status });

    return NextResponse.json({
      resumes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Pending Resumes Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function submitReview(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const resumeReview = await ResumeReview.findById(id);

    if (!resumeReview) {
      return NextResponse.json({ message: 'Resume not found' }, { status: 404 });
    }

    const karma = await UserKarma.findOne({ userId: userProfile?._id });

    resumeReview.reviews.push({
      reviewerId: userProfile?._id,
      isAlumni: karma?.isVerifiedAlumni || false,
      alumniCompany: karma?.alumniCompany,
      ...body,
    });

    resumeReview.currentStatus = 'reviewed';
    await resumeReview.save();

    await updateKarma(userProfile?._id, 'resumesReviewed', 5);

    return NextResponse.json({ message: 'Review submitted successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Submit Review Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getMyResumeReviews(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);

    const resumes = await ResumeReview.find({ userId: userProfile?._id })
      .populate({
        path: 'reviews.reviewerId',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .sort({ created_at: -1 });

    return NextResponse.json({ resumes });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get My Reviews Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ PREP GROUPS ============

export async function createPrepGroup(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);

    const group = new PrepGroup({
      ...body,
      createdBy: userProfile._id,
      admins: [userProfile._id],
      members: [{ userId: userProfile._id, role: 'moderator' }],
    });

    await group.save();

    const populated = await PrepGroup.findById(group._id).populate({
      path: 'createdBy',
      populate: { path: 'authId', select: 'username name' },
      select: 'authId profilePicture',
    });

    return NextResponse.json(
      { message: 'Prep group created', group: populated },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Create Prep Group Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getPrepGroups(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const company = searchParams.get('company');
    const topic = searchParams.get('topic');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: Record<string, any> = {};
    if (type) filter.type = type;
    if (company) filter.targetCompany = new RegExp(company, 'i');
    if (topic) filter.topics = { $in: [new RegExp(topic, 'i')] };
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const groups = await PrepGroup.find(filter)
      .populate({
        path: 'createdBy',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .select('-questions -resources -dailyChallenges')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await PrepGroup.countDocuments(filter);

    const groupsWithCount = groups.map((g) => ({
      ...g.toObject(),
      memberCount: g.members.length,
    }));

    return NextResponse.json({
      groups: groupsWithCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Prep Groups Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getPrepGroup(req: NextRequest, id: string) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const group = await PrepGroup.findById(id)
      .populate({
        path: 'createdBy',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .populate({
        path: 'members.userId',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .populate({
        path: 'resources.addedBy',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .populate({
        path: 'questions.addedBy',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Prep Group Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function joinPrepGroup(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json().catch(() => ({}));

    const userProfile = await ensureProfile(user._id);
    const group = await PrepGroup.findById(id);

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some(
      (m: any) => m.userId.toString() === userProfile?._id.toString()
    );
    if (isMember) {
      return NextResponse.json({ message: 'Already a member' }, { status: 400 });
    }

    if (group.members.length >= group.maxMembers) {
      return NextResponse.json({ message: 'Group is full' }, { status: 400 });
    }

    if (group.isPrivate) {
      group.joinRequests.push({
        userId: userProfile?._id,
        message: body.message,
        requestedAt: new Date(),
      });
      await group.save();
      return NextResponse.json({ message: 'Join request sent' });
    }

    group.members.push({ userId: userProfile?._id, role: 'member' as const, joinedAt: new Date() });
    await group.save();

    return NextResponse.json({ message: 'Joined group successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Join Group Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function leavePrepGroup(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);
    const group = await PrepGroup.findById(id);

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    group.members = group.members.filter(
      (m: any) => m.userId.toString() !== userProfile?._id.toString()
    );
    await group.save();

    return NextResponse.json({ message: 'Left group successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Leave Group Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function addResource(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const group = await PrepGroup.findById(id);

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some(
      (m: any) => m.userId.toString() === userProfile?._id.toString()
    );
    if (!isMember) {
      return NextResponse.json({ message: 'Must be a member to add resources' }, { status: 403 });
    }

    group.resources.push({
      ...body,
      addedBy: userProfile?._id,
    });

    await group.save();
    return NextResponse.json({ message: 'Resource added successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Add Resource Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function addPrepQuestion(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const group = await PrepGroup.findById(id);

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    group.questions.push({
      ...body,
      addedBy: userProfile?._id,
    });

    await group.save();
    await updateKarma(userProfile?._id, 'questionsContributed', 2);

    return NextResponse.json({ message: 'Question added successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Add Question Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ MOCK INTERVIEWS ============

export async function scheduleMockInterview(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);

    const mockInterview = new MockInterview({
      ...body,
      interviewer: body.isInterviewer ? userProfile._id : body.partnerId,
      interviewee: body.isInterviewer ? body.partnerId : userProfile._id,
    });

    await mockInterview.save();

    return NextResponse.json(
      { message: 'Mock interview scheduled', mockInterview },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Schedule Mock Interview Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getMyMockInterviews(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);

    const interviews = await MockInterview.find({
      $or: [{ interviewer: userProfile?._id }, { interviewee: userProfile?._id }],
    })
      .populate({
        path: 'interviewer',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .populate({
        path: 'interviewee',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .sort({ scheduledAt: -1 });

    return NextResponse.json({ interviews });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Mock Interviews Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function submitMockFeedback(req: NextRequest, id: string) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);
    const body = await req.json();

    const userProfile = await ensureProfile(user._id);
    const interview = await MockInterview.findById(id);

    if (!interview) {
      return NextResponse.json({ message: 'Interview not found' }, { status: 404 });
    }

    if (interview.interviewer.toString() !== userProfile?._id.toString()) {
      return NextResponse.json(
        { message: 'Only interviewer can submit feedback' },
        { status: 403 }
      );
    }

    interview.feedback = body;
    interview.status = 'completed';
    await interview.save();

    await updateKarma(userProfile?._id, 'mockInterviewsConducted', 10);
    await updateKarma(interview.interviewee.toString(), 'mockInterviewsAttended', 3);

    return NextResponse.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Submit Feedback Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// ============ KARMA ============

export async function getUserKarma(req: NextRequest) {
  try {
    await dbConnect();
    const user = await verifyAuth(req);

    const userProfile = await ensureProfile(user._id);

    let karma = await UserKarma.findOne({ userId: userProfile?._id });
    if (!karma) {
      karma = new UserKarma({ userId: userProfile?._id });
      await karma.save();
    }

    return NextResponse.json({ karma });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Karma Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function getOpportunityLeaderboard(req: NextRequest) {
  try {
    await dbConnect();
    await verifyAuth(req);

    const leaderboard = await UserKarma.find()
      .populate({
        path: 'userId',
        populate: { path: 'authId', select: 'username name' },
        select: 'authId profilePicture',
      })
      .sort({ totalKarma: -1 })
      .limit(20);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Get Leaderboard Error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
