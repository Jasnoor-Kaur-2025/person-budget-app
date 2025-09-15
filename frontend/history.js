const filterBtn = document.getElementById("filter-btn");
const fromDateInput = document.getElementById("start-date");
const toDateInput = document.getElementById("end-date");
const tableBody = document.querySelector(".history-bottom tbody");
const downloadBtn = document.getElementById("download-btn");

let rangeBudgets = []; // <-- accessible globally

filterBtn.addEventListener("click", async () => {
  const fromDate = new Date(fromDateInput.value);
  const toDate = new Date(toDateInput.value);

  if (!fromDateInput.value || !toDateInput.value || fromDate > toDate) {
    alert("Please enter a valid date range");
    return;
  }

  tableBody.innerHTML = "";
  rangeBudgets = [];

  try {
    const response = await fetch("/get-budgets");
    const budgets = await response.json();

    budgets.forEach(budget => {
      const budgetDate = new Date(budget.date);
      if (budgetDate >= fromDate && budgetDate <= toDate) {
        rangeBudgets.push(budget);

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${budget.date}</td>
          <td>${budget.type}</td>
          <td>${budget.title}</td>
          <td style="color:${budget.type === 'Income' ? 'green' : 'red'};">$${budget.amount}</td>
        `;

        const deleteCell = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.style.cssText = "background:red;color:white;border:none;padding:5px 10px;cursor:pointer";

        deleteBtn.addEventListener("click", async () => {
          const confirmed = confirm("Are you sure you want to delete this budget item?");
          if (confirmed) {
            await fetch(`/delete-budget/${budget.id}`, { method: "DELETE" });
            tableBody.removeChild(row);
          }
        });

        deleteCell.appendChild(deleteBtn);
        row.appendChild(deleteCell);
        tableBody.appendChild(row);
      }
    });
  } catch (error) {
    console.error("Error fetching budgets:", error);
  }
});

// ⬇️ OUTSIDE the forEach loop — runs only once when user clicks Download
downloadBtn.addEventListener("click", () => {
  if (rangeBudgets.length === 0) {
    alert("No transactions found in the selected range.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const fromDate = fromDateInput.value;
  const toDate = toDateInput.value;

  doc.setFontSize(18);
  doc.text("Transaction Report", 14, 20);
  doc.setFontSize(12);
  doc.text(`From ${fromDate} to ${toDate}`, 14, 30);

  const tableData = rangeBudgets.map(t => [
    t.date,
    t.title,
    t.type,
    `$${Number(t.amount).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 40,
    head: [["Date", "Title", "Type", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 11, cellPadding: 3 },
  });

  doc.save(`transactions_${fromDate}_to_${toDate}.pdf`);
});
