const popup = document.getElementById("popupForm");
const addBtn = document.querySelector(".middle-section .add-btn"); // first button
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("transactionForm");
const tableBody = document.querySelector("tbody");

window.addEventListener("DOMContentLoaded", () => {
    fetchBudgets();
    weeklyDate();
    graphExpensesData();
    getGoal();
    checkGoalAchieved();
});
// Open popup
addBtn.addEventListener("click", () => {
    popup.style.display = "flex";
});

// Close popup
closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
});

// Close if clicking outside content
window.addEventListener("click", (e) => {
    if (e.target === popup) popup.style.display = "none";
});

// Handle form submission
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    const amount = document.getElementById("amount").value;
    const type = document.getElementById("type").value;

    // Send data to backend
    await fetch("/add-budget", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            category,
            date,
            amount,
            type
        })
    });

    // Reset + close form
    form.reset();
    popup.style.display = "none";
    fetchBudgets(); // Refresh the budget list
    weeklyDate(); // Refresh the weekly chart
    graphExpensesData();
});

// Fetch and display existing budget items

async function fetchBudgets() {
    const response = await fetch("/get-budgets");
    const budgets = await response.json();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    let income = 0;
    let expense = 0;

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    tableBody.innerHTML = ""; // Clear existing rows
    budgets.forEach(budget => {
        const budgetDate = new Date(budget.date);
        if (budgetDate < startOfMonth || budgetDate >= new Date(currentYear, currentMonth + 1, 1)) return; // Skip if not in current month
        if (budget.type === "Income") {
            income += parseFloat(budget.amount);
        } else {
            expense += parseFloat(budget.amount);
        }
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${budget.date}</td>
      <td>${budget.type}</td>
      <td>${budget.title}</td>
      <td style = "color: ${budget.type === 'Income' ? 'green' : 'red'};">$${budget.amount}</td>`;
        tableBody.appendChild(row);
    });

    const savings = income - expense;
    document.getElementById("income-card").querySelector("p").textContent = `$${income.toFixed(2)}`;
    document.getElementById("expenses-card").querySelector("p").textContent = `$${expense.toFixed(2)}`;
    document.getElementById("savings-card").querySelector("p").textContent = `$${savings.toFixed(2)}`;
}

const formatDate = (date) => {
    return date.toISOString().split("T")[0];
};

//now let's take care of the particular week's history (from monday to sunday)

const weekStart = (date) => {
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
};
const weekEnd = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
};

const weeklyDate = async () => {
    const today = new Date();
    const start = weekStart(new Date(today));
    const end = weekEnd(new Date(today));
    //Now we will iterate over the dates from start to end and write income and expenses for each day from mon to sun if present otehrwise 0
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(formatDate(new Date(d)));
    }

    const incomeData = [];
    const expenseData = [];

    const response = await fetch("/get-budgets");
    const budgets = await response.json();

    dates.forEach(date => {
        const budgetsForDate = budgets.filter(b => b.date === date);
        let dailyIncome = 0;
        let dailyExpense = 0;
        budgetsForDate.forEach(b => {
            if (b.type === "Income") {
                dailyIncome += parseFloat(b.amount);
            } else {
                dailyExpense += parseFloat(b.amount);
            }
        });
        incomeData.push(dailyIncome);
        expenseData.push(dailyExpense);
    });
    const weeklyCtx = document.getElementById("weeklyChart").getContext("2d");
    const labels = [`Mon ${new Date(dates[0]).getDate()}`, `Tue ${new Date(dates[1]).getDate()}`, `Wed ${new Date(dates[2]).getDate()}`, `Thu ${new Date(dates[3]).getDate()}`, `Fri ${new Date(dates[4]).getDate()}`, `Sat ${new Date(dates[5]).getDate()}`, `Sun ${new Date(dates[6]).getDate()}`];
    const backgroundColor = labels.map(() => getRandomColor());
    const weeklyData = {
        labels: labels,
        datasets: [
            {
                label: "Income",
                data: incomeData,
                backgroundColor: backgroundColor
            },
            {
                label: "Expenses",
                data: expenseData,
                backgroundColor: backgroundColor
            }
        ]
    };

    new Chart(weeklyCtx, {
        type: "bar",
        data: weeklyData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: { display: true, text: "Income/Expenses by Category" },
            legend: {
                display: false
            }
        }

    });

}

const getGoal = async () => {
    await fetch("/get-goal")
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0 && data[0].goal !== 0) {
                const goalAmount = data[0].goal;
                document.querySelector(".goal").textContent = `Goal: $${goalAmount}`;
            } else {
                document.querySelector(".goal").textContent = "No goal set";
            }
        });
};

document.getElementById("set-goal-btn").addEventListener("click", () => {
    document.getElementById("goalPopUp").style.display = "flex";

    document.getElementById("closeGoalPopUp").addEventListener("click", () => {
        document.getElementById("goalPopUp").style.display = "none";
    });

    const form = document.getElementById("goalForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const goalAmount = document.getElementById("goalAmount").value;
        const goalDate = document.getElementById("goalDate").value;

        await fetch("/set-goal", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ goal: goalAmount, lastDate: goalDate })
        });

        document.getElementById("goalPopUp").style.display = "none";
        getGoal();
        form.reset();
    });
});

const checkGoalAchieved = async () => {
    await fetch("/get-goal")
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0 && data[0].goal !== 0) {
                const lastDate = new Date(data[0].lastDate);
                const today = new Date();
                if (today > lastDate) {
                    const goalAmount = data[0].goal;
                    const currentSavingsText = document.getElementById("savings-card").querySelector("p").textContent;
                    const currentSavings = parseFloat(currentSavingsText.replace('$', ''));
                    if (currentSavings >= goalAmount) {
                        document.querySelector(".goal").textContent = "Goal Achieved!";
                    } else {
                        document.querySelector(".goal").textContent = "Goal Not Achieved. Set a new goal.";
                    }
                }
            }

        });
    };
