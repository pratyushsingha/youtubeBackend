import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../../models/user.model.js";
import { Subscription } from "../../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!channelId) throw new ApiError(422, "channelId is required");

  const AlreadySubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (channelId === req.user?._id.toString())
    throw new ApiError(400, "u can't subscribe yourself");

  if (!AlreadySubscribed) {
    const subscribedChannel = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });

    if (!subscribedChannel)
      throw new ApiError(
        500,
        "something went wrong while subscribing the channel"
      );

    return res.status(200).json(
      new ApiResponse(
        201,
        {
          isSubscribed: true,
        },
        "channel subscribed successfully"
      )
    );
  }

  const unsubscribeCHannel = await Subscription.deleteOne({
    subscriber: req.user?._id,
    channel: channelId,
  });
  if (!unsubscribeCHannel)
    throw new ApiError(
      500,
      "something went wrong while unsubscribing the channel"
    );

  return res.status(200).json(
    new ApiResponse(
      201,
      {
        isSubscribed: false,
      },
      "channel unsubscribed successfully"
    )
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(422, "channelId is required");
  const subscriberList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
      },
    },
    {
      $unwind: "$subscribers",
    },
  ]);

  if (!subscriberList)
    throw new ApiError(
      500,
      "something went wrong while getting subscriber's list"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        subscriberList,
        "subscriber's list fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) throw new ApiError(422, "subscriberId is required");

  const channelList = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannels",
      },
    },
    {
      $unwind: "$subscribedChannels",
    },
  ]);

  if (!channelList)
    throw new ApiError(
      500,
      "something went wrong while getting subscriber's list"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        channelList,
        "subscribed channel list fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
