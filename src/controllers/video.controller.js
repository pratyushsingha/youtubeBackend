import mongoose, { Schema, isValidObjectId } from "mongoose";
import { Video } from "../../models/video.model.js";
import { User } from "../../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getMongoosePaginationOptions } from "../utils/helper.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const videoAggregate = Video.aggregate([
    {
      $match: {
        isPublished: true,
      },
    },
  ]);
  const videos = await Video.aggregatePaginate(
    videoAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalVideos",
        docs: "videos",
      },
    })
  );
  return res
    .status(200)
    .json(new ApiResponse(201, videos, "videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim === ""))
    throw new ApiError(422, "title and description are required");

  let videoLocalPath, thumbnailLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoLocalPath = req.files.videoFile[0].path;
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  console.log(video);

  if (!video) throw new ApiError(500, "Unable to upload the video");

  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log(thumbnail);

    if (!thumbnail) {
      throw new ApiError(500, "Unable to upload the thumbnail");
    }

    const publishedVideo = await Video.create({
      videoFile: video.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration: video.duration,
      owner: req.user?._id,
    });

    if (!publishedVideo) {
      throw new ApiError(500, "Unable to publish the video");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, publishedVideo, "Video published successfully")
      );
  } else {
    throw new ApiError(422, "Thumbnail file is required");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) throw new ApiError(422, "videoId is required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "video doesn't exists");

  return res
    .status(200)
    .json(new ApiResponse(201, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;

  if (!videoId) throw new ApiError(422, "videoId is required");

  if ([title, description].some((field) => field.trim === ""))
    throw new ApiError(422, "title,description is required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "video doesn't exist");

  if (!(video.owner?._id.toString() === req.user?._id.toString()))
    throw new ApiError(400, "unauthorized request");

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(422, "thumbnail is missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url)
    throw new ApiError(500, "error while uploading the thumbnail");

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: thumbnail.url,
    },
    { new: true }
  );
  if (!updatedVideo)
    throw new ApiError(500, "something went wrong while updating the video");

  return res
    .status(200)
    .json(new ApiResponse(201, updatedVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) throw new ApiError(422, "videoId is required");

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) throw new ApiError(400, "video doesn't exists");

  if (!(existingVideo.owner?._id.toString() === req.user?._id.toString()))
    throw new ApiError(400, "unauthorized request");

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo)
    throw new ApiError(500, "something went wrong while deleteing the video");

  return res.status(200).json(
    new ApiResponse(
      201,
      {
        isDeleted: true,
      },
      "video deleted successfully"
    )
  );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(422, "videoId is required");

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) throw new ApiError(400, "video doesn't exists");
  let publishStatus;
  if (existingVideo.isPublished === true) {
    publishStatus = await Video.findByIdAndUpdate(videoId, {
      isPublished: false,
    });
    if (!publishStatus)
      throw new ApiError(
        500,
        "something went wrong while unpublishing the video"
      );

    return res.status(200).json(
      new ApiResponse(
        201,
        {
          isPublished: false,
        },
        "video unpublished successfully"
      )
    );
  } else {
    publishStatus = await Video.findByIdAndUpdate(videoId, {
      isPublished: true,
    });
    if (!publishStatus)
      throw new ApiError(
        500,
        "something went wrong while publishing the video"
      );

    return res.status(200).json(
      new ApiResponse(
        201,
        {
          isPublished: true,
        },
        "video published successfully"
      )
    );
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
