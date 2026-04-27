const Complain = require('../models/complainSchema.js');

const complainCreate = async (req, res) => {
    try {
        const complain = new Complain(req.body);
        const result = await complain.save();
        res.send(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

const complainList = async (req, res) => {
    try {
        let complains = await Complain.find({ school: req.params.id })
            .populate("user", "name rollNum")
            .populate("assignedTo", "name")
            .populate("responseBy", "name")
            .sort({ createdAt: -1 }); // Sort by newest first
        
        if (complains.length > 0) {
            res.send(complains);
        } else {
            res.send({ message: "No complains found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const updateComplainStatus = async (req, res) => {
    try {
        const { status, response, responseBy } = req.body;
        const updateData = { status };
        
        if (response) {
            updateData.response = response;
            updateData.responseBy = responseBy;
            updateData.responseDate = new Date();
        }
        
        const result = await Complain.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate("user", "name rollNum")
         .populate("assignedTo", "name")
         .populate("responseBy", "name");
        
        if (result) {
            res.send(result);
        } else {
            res.send({ message: "Complaint not found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const assignComplain = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const result = await Complain.findByIdAndUpdate(
            req.params.id,
            { assignedTo, status: 'In Review' },
            { new: true }
        ).populate("user", "name rollNum")
         .populate("assignedTo", "name")
         .populate("responseBy", "name");
        
        if (result) {
            res.send(result);
        } else {
            res.send({ message: "Complaint not found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const deleteComplain = async (req, res) => {
    try {
        const result = await Complain.findByIdAndDelete(req.params.id);
        if (result) {
            res.send({ message: "Complaint deleted successfully" });
        } else {
            res.send({ message: "Complaint not found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getComplainStats = async (req, res) => {
    try {
        const schoolId = req.params.id;
        
        const totalComplaints = await Complain.countDocuments({ school: schoolId });
        const pendingComplaints = await Complain.countDocuments({ school: schoolId, status: 'Pending' });
        const inReviewComplaints = await Complain.countDocuments({ school: schoolId, status: 'In Review' });
        const resolvedComplaints = await Complain.countDocuments({ school: schoolId, status: 'Resolved' });
        
        const stats = {
            total: totalComplaints,
            pending: pendingComplaints,
            inReview: inReviewComplaints,
            resolved: resolvedComplaints,
            closed: await Complain.countDocuments({ school: schoolId, status: 'Closed' })
        };
        
        res.send(stats);
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = { 
    complainCreate, 
    complainList, 
    updateComplainStatus, 
    assignComplain, 
    deleteComplain, 
    getComplainStats 
};
