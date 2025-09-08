const filterBtn = document.getElementById("filter-btn");
const fromDateInput = document.getElementById("start-date");
const toDateInput = document.getElementById("end-date");
const tableBody = document.querySelector(".history-bottom tbody");

filterBtn.addEventListener("click", async () => {
  const fromDate = new Date(fromDateInput.value);
  const toDate = new Date(toDateInput.value);

  if (!fromDateInput.value || !toDateInput.value || fromDate > toDate) {
    alert("Please enter a valid date range");
    return;
  }

  // Clear old rows before filtering
  tableBody.innerHTML = "";

  try {
    const response = await fetch("/get-budgets");
    const budgets = await response.json();

    budgets.forEach(budget => {
      const budgetDate = new Date(budget.date);
      if (budgetDate >= fromDate && budgetDate <= toDate) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${budget.date}</td>
          <td>${budget.type}</td>
          <td>${budget.title}</td>
          <td style = "color: ${budget.type === 'Income' ? 'green' : 'red'};">$${budget.amount}</td>
        `;
        tableBody.appendChild(row);
      }
    });
  } catch (error) {
    console.error("Error fetching budgets:", error);
  }
});
