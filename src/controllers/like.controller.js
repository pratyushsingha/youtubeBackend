import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getMongoosePaginationOptions } from "../utils/helper.js";
import { Video } from "../../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) throw new ApiError(422, "videoId is required");

  const AlreadyLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!AlreadyLiked) {
    const likeVideo = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (!likeVideo)
      throw new ApiError(500, "something went wrong while liking the video");

    return res.status(200).json(
      new ApiResponse(
        201,
        {
          isLiked: true,
        },
        "video liked successfully"
      )
    );
  }

  const dislikeVideo = await Like.deleteOne({
    video: videoId,
    likedBy: req.user?._id,
  });
  if (!dislikeVideo)
    throw new ApiError(500, "something went wrong while disliking the video");

  return res.status(200).json(
    new ApiResponse(
      201,
      {
        isLiked: false,
      },
      "video disliked successfully"
    )
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId) throw new ApiError(422, "commentId is required");

  const AlreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!AlreadyLiked) {
    const likeComment = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (!likeComment)
      throw new ApiError(500, "something went wrong while liking the comment");

    return res.status(200).json(
      new ApiResponse(
        201,
        {
          isLiked: true,
        },
        "comment liked successfully"
      )
    );
  }

  const dislikeComment = await Like.deleteOne({
    comment: commentId,
    likedBy: req.user?._id,
  });
  if (!dislikeComment)
    throw new ApiError(500, "something went wrong while liking the comment");

  return res.status(200).json(
    new ApiResponse(
      201,
      {
        isLiked: false,
      },
      "comment disliked successfully"
    )
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId) throw new ApiError(422, "tweetId is required");

  const AlreadyLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!AlreadyLiked) {
    const likeTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (!likeTweet)
      throw new ApiError(500, "something went wrong while liking the tweet");

    return res.status(200).json(
      new ApiResponse(
        201,
        {
          isLiked: true,
        },
        "tweet liked successfully"
      )
    );
  }

  const dislikeTweet = await Like.deleteOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  if (!dislikeTweet)
    throw new ApiError(500, "something went wrong while disliking the tweet");

  return res.status(200).json(
    new ApiResponse(
      201,
      {
        isLiked: false,
      },
      "tweet disliked successfully"
    )
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    [
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "likedVideos",
        },
      },
      {
        $unwind: "$likedVideos",
      },
      {
        $project: {
          likedVideos: 1,
        },
      },
    ],
  ]);

  if (!likedVideos)
    throw new ApiError(
      500,
      "something went wrong while getting all liked videos"
    );

  return res
    .status(200)
    .json(new ApiResponse(201, likedVideos, "videos fetched successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
