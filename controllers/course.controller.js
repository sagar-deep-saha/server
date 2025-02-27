import { Course } from "../models/course.model.js"
import { Lecture } from "../models/lecture.model.js";
import { deleteMedia, deletePdf, deleteVideo, uploadMedia } from "../utils/cloudinary.js"


export const createCourse = async (req, res) => {
  try {
    const { courseTitle, category } = req.body;
    if (!courseTitle || !category) {
      console.log("This Course Title & Category are required");
      return res.status(400).json({
        message: "This Course Title & Category are required"
      })
    }

    const course = await Course.create({
      courseTitle,
      category,
      creator: req.id
    });



    return res.status(201).json({
      message: "Course Created"
    })





  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Faild to create course"
    })

  }
};


export const getPublishedCourse = async (_, res) =>{
try {
  const courses = await Course.find({isPublished:true}).populate({path:"creator", select:"name photoUrl"});
  if(!courses){
    return res.status(404).json({
      message:"Course not found"
    })
  }

  return res.status(200).json({
    courses,
    success: true,
      // courses: publishedCourses,
  });


} catch (error) {
  console.log(error);
  return res.status(500).json({
    message: "Faild to get pub courses"
  });

}
};


export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.id;
    const courses = await Course.find({ creator: userId });

    if (!courses || courses.length === 0) {
      return res.status(404).json({
        courses: [],
        message: "Course not found"
      });
    }

    return res.status(200).json({
      courses: courses,
      message: "Course found"
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Failed to fetch course"
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { courseTitle, subTitle, description, category, courseLevel, coursePrice } = req.body;
    const thumbnail = req.file;

    let course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found!"
      });
    }

    let courseThumbnail = course.courseThumbnail;
    if (thumbnail) {
      if (course.courseThumbnail) {
        const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
        await deleteMedia(publicId);
      }
      const uploadResult = await uploadMedia(thumbnail.path);
      courseThumbnail = uploadResult.secure_url;
    }

    const updateData = {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      courseThumbnail
    };

    course = await Course.findByIdAndUpdate(courseId, updateData, { new: true });

    return res.status(200).json({
      course,
      message: "Updated successfully!"
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Failed to edit course"
    });
  }
};


// bhjhguyg





export const getCourseById = async (req, res) => {

  try {
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        course,
        message: "Course not found!"
      })
    }

    return res.status(200).json({
      course
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get course bu id."
    });
  }


};

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        message: "Lectue title is Required"
      });
    }


    const lecture = await Lecture.create({ lectureTitle });
    const course = await Course.findById(courseId);

    if (course) {
      course.lectures.push(lecture._id);
      await course.save();
    }
    return res.status(201).json({
      lecture,
      message: "Lecture created successfully!"
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to create lecture."
    });
  }
};

export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    return res.status(200).json({
      lectures: course.lectures,
      message: "Lectures found",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get lecture.",
    });
  }
};


// export const editLecture = async (req,res) => {
//   console.log('Request Params:', req.params);
//   console.log('Request Body:', req.body);
//   console.log("receives");
  
//   try {
//       const {lectureTitle, videoInfo, isPreviewFree} = req.body;
      
//       const {courseId, lectureId} = req.params;
//       const lecture = await Lecture.findById(lectureId);
   
//       if(!lecture){
//           return res.status(404).json({
//               message:"Lecture not found!"
//           })
//       }

//       // update lecture
//       if(lectureTitle) lecture.lectureTitle = lectureTitle;
//       if(videoInfo?.videoUrl) lecture.videoUrl = videoInfo.videoUrl;
//       if(videoInfo?.publicId) lecture.publicId = videoInfo.publicId;
//       lecture.isPreviewFree = isPreviewFree;

//       await lecture.save();

//       // Ensure the course still has the lecture id if it was not aleardy added;
//       const course = await Course.findById(courseId);
//       if(course && !course.lectures.includes(lecture._id)){
//           course.lectures.push(lecture._id);
//           await course.save();
//       };
//       return res.status(200).json({
//         lectureTitle: lecture.lectureTitle,
//       publicId: lecture.publicId,
//       videoUrl: lecture.videoUrl,
//       isPreviewFree: lecture.isPreviewFree, // Ensure this property is included
//       updatedAt: lecture.updatedAt,
//       __v: lecture.__v,
//           lecture,
//           message:"Lecture updated successfully."
//       })
//   } catch (error) {
//       console.log(error);
//       return res.status(500).json({
//           message:"Failed to edit lectures"
//       })
//   }
// }

export const editLecture = async (req, res) => {
  console.log('Request Params:', req.params);
  console.log('Request Body:', req.body);
  console.log("receives");

  try {
    const { lectureTitle, videoInfo, isPreviewFree } = req.body;
    const { courseId, lectureId } = req.params;

    // Validate input
    if (!lectureTitle || typeof isPreviewFree === 'undefined') {
      return res.status(400).json({
        message: "Lecture title and preview status are required!"
      });
    }

    // Find the lecture by ID
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found!"
      });
    }

    // Update lecture fields
    if (lectureTitle) lecture.lectureTitle = lectureTitle;
    if (videoInfo?.videoUrl) lecture.videoUrl = videoInfo.videoUrl;
    if (videoInfo?.publicId) lecture.publicId = videoInfo.publicId;
    lecture.isPreviewFree = isPreviewFree;

    // Save the updated lecture
    await lecture.save();

    // Ensure the course still has the lecture ID if it was not already added
    const course = await Course.findById(courseId);
    if (course && !course.lectures.includes(lecture._id)) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    // Respond with the updated lecture details
    return res.status(200).json({
      lecture: {
        _id: lecture._id,
        lectureTitle: lecture.lectureTitle,
        videoUrl: lecture.videoUrl,
        publicId: lecture.publicId,
        isPreviewFree: lecture.isPreviewFree, // Ensure this property is included
        createdAt: lecture.createdAt,
        updatedAt: lecture.updatedAt,
        __v: lecture.__v,
      },
      message: "Lecture updated successfully."
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to edit lecture"
    });
  }
};


    // Remove Lecture
    export const removeLecture = async (req, res) => {
      try {
        const { lectureId } = req.params;
        const lecture = await Lecture.findByIdAndDelete(lectureId);

        if (!lecture) {
          return res.status(404).json({
            message: "Lecture not found"
          });
        }

        if (lecture.publicId) {
          await deleteVideo(lecture.publicId);
          await deletePdf(lecture.publicId);
        }

        await Course.updateOne(
          { lectures: lectureId },
          { $pull: { lectures: lectureId } }
        );

        return res.status(200).json({
          message: "Lecture removed Successfully",
        });

      } catch (error) {
        console.log(error);
        return res.status(500).json({
          message: "Failed to remove lecture.",
        });
      }
    };

    // Get Lecture by ID
    export const getLectureById = async (req, res) => {
      try {
        const { lectureId } = req.params;
        const lecture = await Lecture.findById(lectureId);

        if (!lecture) {
          return res.status(404).json({
            message: "Lecture not found"
          });
        }

        return res.status(200).json({
          lecture
        });

      } catch (error) {
        console.log(error);
        return res.status(500).json({
          message: "Failed to get lecture.",
        });
      }
    };

    export const togglePublishedCourse = async (req, res) => {
      try {
        const { courseId } = req.params;
        const { publish } = req.query;
        console.log(`Received request to toggle publish status for courseId: ${courseId}, publish: ${publish}`);
        
        const course = await Course.findById(courseId);
    
        if (!course) {
          return res.status(404).json({
            message: "course not found"
          });
        }
    
        course.isPublished = publish === "true";
        await course.save();
    
        const statusMessage = course.isPublished ? "Published" : "Unpublished";
        console.log(`Course ${courseId} is now ${statusMessage}`);
        return res.status(200).json({
          message: `Course ${statusMessage}`
        });
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          message: "Failed to update status.",
        });
      }
    };
    