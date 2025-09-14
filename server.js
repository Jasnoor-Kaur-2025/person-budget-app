import fs from "fs";
import path from "path"; 
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '/frontend')));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '/frontend', 'index.html'));
})

//now we will handle the api requests
//first is the post request to add a new budget item.

app.post("/add-budget", (req, res) => {
    const {title, category, amount, type, date} = req.body;
    if (!title || !category || !amount || !type || !date) {
        return res.status(400).json({message: "All fields are required"});
    }

    //now we will try opening a file in frontend/budget.json
    try{
        const budgetFilePath = path.join(__dirname, 'budget.json');
        if (!fs.existsSync(budgetFilePath)) {
            fs.writeFileSync(budgetFilePath, JSON.stringify([]));
        }

        //let's first read the current data from the file
        const currentData = JSON.parse(fs.readFileSync(budgetFilePath));
        //now we will add the new budget item to the current data
        const budgetData = {
            id: Date.now(),
            title : title,
            category: category,
            amount: amount,
            type: type, 
            date: date
        };
        currentData.push(budgetData);
        fs.writeFileSync(budgetFilePath, JSON.stringify(currentData, null, 2));
        res.status(200).json({message: "Budget item added successfully"});
    } catch (error){
        console.error("Error writing to budget.json:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

app.get("/get-budgets", (req, res) => {
    try {
        const budgetFilePath = path.join(__dirname, 'budget.json');

        // Create file if it doesn't exist
        if (!fs.existsSync(budgetFilePath)) {
            fs.writeFileSync(budgetFilePath, JSON.stringify([]));
        }

        // Read and parse data
        let budgetData = [];
        try {
            budgetData = JSON.parse(fs.readFileSync(budgetFilePath));
        } catch (err) {
            console.error("Invalid JSON, resetting file:", err);
            budgetData = [];
            fs.writeFileSync(budgetFilePath, JSON.stringify([]));
        }

        res.status(200).json(budgetData);
    } catch (error) {
        console.error("Error reading budget.json:", error);
        res.status(500).json({message: "Internal server error", error: error.message});
    }
});

app.get("/get-goal", (req, res) => {
    try{
        const goalFile = path.join(__dirname, 'goal.json');
        if (!fs.existsSync(goalFile)) {
            fs.writeFileSync(goalFile, JSON.stringify([]));
        }

        let goalData = [];
        try{
            goalData = JSON.parse(fs.readFileSync(goalFile));
        } catch (err) {
            console.error("Invalid JSON, resetting file:", err);
            goalData = [];
            fs.writeFileSync(goalFile, JSON.stringify([]));
        }

        res.status(200).json(goalData);
    } catch (error) {
        console.error("Error reading goal.json:", error);
        res.status(500).json({message: "Internal server error", error: error.message});
    }
})

app.post("/set-goal", (req, res) => {
    const {goal, lastDate} = req.body;
    if (!lastDate || !goal) {
        return res.status(400).json({message: "Goal amount and last date are required"});
    }
    try{
        const goalFile = path.join(__dirname, 'goal.json');
        if (!fs.existsSync(goalFile)) {
            fs.writeFileSync(goalFile, JSON.stringify([]));
        }
        const goalData = {lastDate: lastDate, goal: goal};
        fs.writeFileSync(goalFile, JSON.stringify([goalData], null, 2));
        res.status(200).json({message: "Goal set successfully"});
    } catch (error) {
        console.error("Error writing to goal.json:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

app.delete("/delete-budget/:id", (req, res) => {
    const budgetId = parseInt(req.params.id);
    if (isNaN(budgetId)) {
        return res.status(400).json({message: "Invalid budget ID"});
    }
    try {
        const budgetFilePath = path.join(__dirname, 'budget.json');
        if (!fs.existsSync(budgetFilePath)) {
            return res.status(404).json({message: "No budget items found"});
        }
        const currentData = JSON.parse(fs.readFileSync(budgetFilePath));
        const updatedData = currentData.filter(item => item.id !== budgetId);
        fs.writeFileSync(budgetFilePath, JSON.stringify(updatedData, null, 2));
        res.status(200).json({message: "Budget item deleted successfully"});
    } catch (error) {
        console.error("Error deleting budget item:", error);
        res.status(500).json({message: "Internal server error"});
    }
})
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});