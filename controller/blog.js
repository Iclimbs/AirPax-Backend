require("dotenv").config();
const express = require("express");
const { FeaturedBlogModel } = require("../model/featuredblog.model");
const BlogRouter = express.Router();
const { PopularBlogModel } = require("../model/popularblog.model");
const { ActivityCardBlogModel } = require("../model/activitycardblog.model");
const { ActivityBlogModel } = require("../model/activityblog.model");
const { uploadMiddleWare } = require("../middleware/FileUpload")

// Popular Blog Routes

BlogRouter.post("/popularblog/add", uploadMiddleWare.single("img"), async (req, res) => {
    const { title, place } = req.body;
    if (!req?.file) {
        return res.json({
            status: "error",
            message: `Please Upload Image`,
        });
    }
    try {
        const newpopularblog = new PopularBlogModel({
            title,
            place,
            img: req?.file?.location,
        });
        await newpopularblog.save();
        res.json({ status: "success", message: "New Popular Blog Added !!" });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Add New Popular Blog ${error.message}`,
        });
    }
});

BlogRouter.patch("/popularblog/edit/:id", uploadMiddleWare.single("img"), async (req, res) => {
    const { id } = req.params;
    const { title, place } = req.body;
    try {
        const popularblog = await PopularBlogModel.find({ _id: id });
        popularblog[0].title = title,
            popularblog[0].place = place
        if (req.file) {
            popularblog[0].img = req.file.location
        }
        await popularblog[0].save();
        res.json({
            status: "success",
            message: "Popular Blog Details Successfully Updated !!",
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Update Popular Blog Item Details ${error.message}`,
        });
    }
}
);

BlogRouter.patch("/popularblog/disable/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const popularblog = await PopularBlogModel.findById({ _id: id });
        popularblog.status = !popularblog.status;
        await popularblog.save();
        res.json({
            status: "success",
            message: "Popular Blog Item Availability Updated !!",
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Update Popular Blog Item Availability ${error.message}`,
        });
    }
});

BlogRouter.get("/popularblog/listall", async (req, res) => {
    try {
        const popularBlogList = await PopularBlogModel.find({});
        if (popularBlogList.length !== 0) {
            res.json({ status: "success", data: popularBlogList });
        } else {
            res.json({
                status: "error",
                message: "No Blog Found In Popular Seaction",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Popular Blog List ${error.message}`,
        });
    }
});

BlogRouter.get("/popularblog/listall/active", async (req, res) => {
    try {
        const popularBlogList = await PopularBlogModel.find({ status: true });
        if (popularBlogList.length !== 0) {
            res.json({ status: "success", data: popularBlogList });
        } else {
            res.json({
                status: "error",
                message: "No Active Blog Found In Popular Seaction",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Active Popular Blog List ${error.message}`,
        });
    }
});

// Activity Card Blog Routes

BlogRouter.post("/activitycardblog/add", uploadMiddleWare.single("img"), async (req, res) => {
    const { title, activity } = req.body;
    if (!req?.file) {
        return res.json({
            status: "error",
            message: `Please Upload Image`,
        });
    }
    try {
        const newactivitycardblog = new ActivityCardBlogModel({
            title,
            img: req.file.location,
            activity,
        });
        await newactivitycardblog.save();
        res.json({ status: "success", message: "New Activity Blog Added !!" });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Add New Activity Blog ${error.message}`,
        });
    }
}
);

BlogRouter.patch("/activitycardblog/edit/:id", uploadMiddleWare.single("img"), async (req, res) => {
    const { id } = req.params;
    const { title, activity } = req.body;
    try {
        const activitycardblog = await ActivityCardBlogModel.find({ _id: id });
        activitycardblog[0].title = title
        activitycardblog[0].activity = activity
        if (req.file) {
            activitycardblog[0].img = req.file.location
        }

        await activitycardblog[0].save();
        res.json({
            status: "success",
            message: "Activity Card Details Successfully Updated !!",
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Update Activity Card Details ${error.message}`,
        });
    }
}
);

BlogRouter.patch("/activitycardblog/disable/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const activityblog = await ActivityCardBlogModel.findById({ _id: id });
        activityblog.status = !activityblog.status;
        await activityblog.save();
        res.json({
            status: "success",
            message: "Activity Card Availability Updated !!",
        });
    } catch (error) {
        res.json({ status: "error", message: "Failed To Update Activity Card" });
    }
});

BlogRouter.get("/activitycardblog/listall", async (req, res) => {
    try {
        const activityCardList = await ActivityCardBlogModel.find();
        if (activityCardList.length !== 0) {
            res.json({ status: "success", data: activityCardList });
        } else {
            res.json({
                status: "error",
                message: "No Blog Found In Activity Seaction",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Activity Blog List ${error.message}`,
        });
    }
});

BlogRouter.get("/activitycardblog/listall/active", async (req, res) => {
    try {
        const activityCardList = await ActivityCardBlogModel.find({ status: true });
        if (activityCardList.length !== 0) {
            res.json({ status: "success", data: activityCardList });
        } else {
            res.json({
                status: "error",
                message: "No Active Blog Found In Activity Seaction",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Activity Blog List ${error.message}`,
        });
    }
});

// Activity Blog Routes

BlogRouter.post("/activity/add", uploadMiddleWare.single("img"), async (req, res) => {
    const { title, tour } = req.body;
    if (!req?.file) {
        return res.json({
            status: "error",
            message: `Please Upload Image`,
        });
    }
    try {
        const newactivityblog = new ActivityBlogModel({
            title,
            img: req.file?.location,
            tour,
        });
        await newactivityblog.save();
        res.json({ status: "success", message: "New Activity Blog Added !!" });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Add New Activity Blog ${error.message}`,
        });
    }
});

BlogRouter.patch("/activity/edit/:id", uploadMiddleWare.single("img"), async (req, res) => {
    const { id } = req.params;
    const { title, tour } = req.body;

    try {
        const activityblog = await ActivityBlogModel.find({ _id: id });
        activityblog[0].title = title;
        activityblog[0].tour = tour
        if (req.file) {
            activityblog[0].img = req.file.location
        }
        await activityblog[0].save();
        res.json({
            status: "success",
            message: "Activity Details Successfully Updated !!",
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Update Activity Blog Details ${error.message}`,
        });
    }
}
);

BlogRouter.patch("/activity/disable/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const activityblog = await ActivityBlogModel.findById({ _id: id });
        activityblog.status = !activityblog.status;
        await activityblog.save();
        res.json({
            status: "success",
            message: "Activity Details Availability Updated !!",
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Update Food Item Availability Details ${error.message}`,
        });
    }
});

BlogRouter.get("/activity/listall", async (req, res) => {
    try {
        const activityList = await ActivityBlogModel.find();
        if (activityList.length > 0) {
            res.json({ status: "success", data: activityList });
        } else {
            res.json({
                status: "error",
                message: "No Blog Found in Activity Section",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Activity List ${error.message}`,
        });
    }
});

BlogRouter.get("/activity/listall/active", async (req, res) => {
    try {
        const activityList = await ActivityBlogModel.find({ status: true });
        if (activityList.length > 0) {
            res.json({ status: "success", data: activityList });
        } else {
            res.json({
                status: "error",
                message: "No Active Blog Found in Activity Section",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Active Activity List ${error.message}`,
        });
    }
});

// Feature Blog Routes

BlogRouter.post("/featuredblog/add", uploadMiddleWare.single("img"), async (req, res) => {
    const { title } = req.body;
    if (!req?.file) {
        return res.json({
            status: "error",
            message: `Please Upload Image`,
        });
    }
    try {
        const newfeaturedblog = new FeaturedBlogModel({ title, img: req.file?.location });
        await newfeaturedblog.save();
        res.json({ status: "success", message: "New Featured Blog Added !!" });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Add New Blog ${error.message}`,
        });
    }
});

BlogRouter.patch("/featuredblog/edit/:id", uploadMiddleWare.single("img"), async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;

    try {
        const featuredList = await FeaturedBlogModel.find({ _id: id });
        featuredList[0].title = title
        if (req.file) {
            featuredList[0].img = req.file.location
        }
        await featuredList[0].save();
        res.json({
            status: "success",
            message: "Fetured List Item Details Successfully Updated !!",
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Update Food Item Details ${error.message}`,
        });
    }
}
);

BlogRouter.patch("/featuredblog/disable/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const featuredList = await FeaturedBlogModel.findById({ _id: id });
        featuredList.status = !featuredList.status;
        await featuredList.save();
        res.json({
            status: "success",
            message: "Featured List Item Availability Updated !!",
        });
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Update Featured List Item Availability Details ${error.message}`,
        });
    }
});

BlogRouter.get("/featuredblog/listall", async (req, res) => {
    try {
        const featuredList = await FeaturedBlogModel.find();
        if (featuredList.length > 0) {
            res.json({ status: "success", data: featuredList });
        } else {
            res.json({
                status: "error",
                message: "No Featured Blog Found in Featured Section",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Featured List Item Details ${error.message}`,
        });
    }
});

BlogRouter.get("/featuredblog/listall/active", async (req, res) => {
    try {
        const featuredList = await FeaturedBlogModel.find({ status: true });
        if (featuredList.length > 0) {
            res.json({ status: "success", data: featuredList });
        } else {
            res.json({
                status: "error",
                message: "No Active Featured Blog Found in Featured Section",
            });
        }
    } catch (error) {
        res.json({
            status: "error",
            message: `Failed To Get Active Featured List Item Details ${error.message}`,
        });
    }
});

module.exports = { BlogRouter };
