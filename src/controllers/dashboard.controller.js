import mongoose from "mongoose";
import { Video } from "../../models/video.model.js";
import { Subscription } from "../../models/subscription.model.js";
import { Like } from "../../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const stats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalSubscribers: {
          $first: {
            $size: "$subscribers",
          },
        },
        totalLikes: {
          $first: {
            $size: "$likes",
          },
        },
      },
    },
    {
      $project: {
        totalSubscribers: 1,
        totalLikes: 1,
        totalVideos: 1,
        totalViews: 1,
      },
    },
  ]);

  if (!stats)
    throw new ApiError(
      500,
      "something went wrong while fetching channel stats"
    );

  return res
    .status(200)
    .json(new ApiResponse(201, stats, "channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const channelVideos = await Video.find({
    owner: req.user?._id,
  });

  if (!channelVideos)
    throw new ApiError(
      500,
      "something went wrong while fetching videos of the channel"
    );

  return res
    .status(200)
    .json(new ApiResponse(201, channelVideos, "videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
