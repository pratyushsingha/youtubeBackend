import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../../models/tweet.model.js";
const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content) throw new ApiError(400, "tweet can't be empty");
  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) throw new ApiError(500, "unable to create tweet");

  return res
    .status(200)
    .json(new ApiResponse(201, tweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId) throw new ApiError(400, "userId is required");

  const tweets = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "allTweets",
      },
    },
    {
      $project: {
        allTweets: 1,
      },
    },
  ]);

  if (!tweets)
    throw new ApiError(500, "something went wrong while fetching the tweets");

  return res
    .status(200)
    .json(new ApiResponse(201, tweets, "tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!tweetId) {
    throw new ApiError(400, "tweetId is required");
  }

  const existingTweet = await Tweet.findById(tweetId);
  if (!existingTweet) {
    throw new ApiError(400, "tweet doesn't exist");
  }

  const verifyUser =
    existingTweet.owner?.toString() === req.user?._id.toString();
  if (!verifyUser) {
    throw new ApiError(400, "unauthorized access");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "unable to update the tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, updatedTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  const existingTweet = await Tweet.findById(tweetId);
  if (!existingTweet) {
    throw new ApiError(400, "tweet doesn't exist");
  }

  const verifyUser =
    existingTweet.owner?.toString() === req.user?._id.toString();
  if (!verifyUser) {
    throw new ApiError(400, "unauthorized access");
  }
  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) {
    throw new ApiError(500, "unable to delte the tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
