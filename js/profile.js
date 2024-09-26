const jwtToken = localStorage.getItem("jwtToken");
if (!jwtToken) {
    window.location.href = "index.html";
}

// Logout functionality
document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("jwtToken");
    window.location.href = "index.html";
});

// GraphQL queries
async function Query(query, token) {
    const response = await fetch(
        "https://01.kood.tech/api/graphql-engine/v1/graphql",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query }),
        }
    );
    const result = await response.json();
    return result.data;
}

(async () => {
    try {
        const userIdQuery = `
            query {
                user {
                    id
                }
            }
        `;
        let IdData = await Query(userIdQuery, jwtToken);
        const userID = IdData.user[0].id;

        const query = `query {
            downTransactions: transaction_aggregate(
                where: { userId: { _eq: ${userID} }, type: { _eq: "down" } }
            ) {
                aggregate {
                    count
                }
            }
            upTransactions: transaction_aggregate(
                where: { userId: { _eq: ${userID} }, type: { _eq: "up" } }
            ) {
                aggregate {
                    count
                }
            }
            event(where: { id: { _eq: 148 } }) {
                createdAt
            }
            user(where: { id: { _eq: ${userID} } }) {
                id
                email
                login
                auditRatio
                attrs
                profile
                totalXP: transactions_aggregate(
                    where: {
                        type: { _eq: "xp" },
                        event: { id: { _eq: 148 } }
                    }
                ) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }
                transactions(
                    where: {
                        type: { _eq: "xp" },
                        event: { id: { _eq: 148 } }
                    },
                    order_by: { createdAt: asc }
                ) {
                    amount
                    path
                    type
                    createdAt
                }
            }
        }`;

        let data = await Query(query, jwtToken);
        let usr = data.user[0];

        let userName = "";

        if (usr.attrs && usr.attrs.firstName && usr.attrs.lastName) {
            userName = `${usr.attrs.firstName} ${usr.attrs.lastName}`;
        } else if (usr.login) {
            userName = usr.login;
        } else if (usr.email) {
            userName = usr.email;
        } else {
            userName = "Your";
        }

        document.getElementById(
            "profile-heading"
        ).textContent = `${userName}'s Profile`;

        document.getElementById("profile-info").innerHTML = `
            <p>ID: ${usr.id}</p>
            <p>Login: ${usr.login}</p>
            <p>Email: ${usr.email}</p>
        `;

        let totalXP = usr.totalXP.aggregate.sum.amount || 0;
        document.getElementById("xpText").textContent = totalXP;

        let auditRat = usr.auditRatio + "";
        document.getElementById("ratioText").textContent = auditRat.slice(0, 6);

        let cumulativeXP = 0;
        let xpArr = [];
        xpArr.push({
            xp: 0,
            day: data.event[0].createdAt,
            event: "Start of school",
        });
        usr.transactions.forEach((trans) => {
            cumulativeXP += trans.amount;
            xpArr.push({
                xp: cumulativeXP,
                day: trans.createdAt,
                event: trans.path.substring(trans.path.lastIndexOf("/") + 1),
            });
        });

        const xpData = xpArr.map((entry) => [
            new Date(entry.day),
            entry.xp,
            `XP: ${entry.xp}, Project: ${entry.event}`,
        ]);

        google.charts.load("current", { packages: ["corechart"] });
        google.charts.setOnLoadCallback(() => {
            drawLineChart(xpData);
            drawPieChart([
                ["Audits Given", data.upTransactions.aggregate.count],
                ["Audits Received", data.downTransactions.aggregate.count],
            ]);
        });

        function drawLineChart(xpData) {
            const dataTable = new google.visualization.DataTable();
            dataTable.addColumn("date", "Date");
            dataTable.addColumn("number", "XP");
            dataTable.addColumn({ type: "string", role: "tooltip" }); // Custom tooltip column
            dataTable.addRows(xpData);

            const options = {
                title: "Cumulative XP Over Time",
                hAxis: {
                    title: "Date",
                    textStyle: { color: "#ffffff" },
                    gridlines: { color: "#3a3a3a" },
                },
                vAxis: {
                    title: "Cumulative XP",
                    textStyle: { color: "#ffffff" },
                    gridlines: { color: "#3a3a3a" },
                },
                backgroundColor: "#1e1e1e",
                titleTextStyle: { color: "#ffffff" },
                legend: { position: "none" },
                curveType: "function",
                series: {
                    0: {
                        color: "#4CAF50",
                        pointShape: "circle",
                        pointSize: 5,
                    },
                },
                tooltip: { isHtml: true },
            };

            const chart = new google.visualization.LineChart(
                document.getElementById("xpChart")
            );
            chart.draw(dataTable, options);
        }

        function drawPieChart(pieData) {
            const dataTable = new google.visualization.DataTable();
            dataTable.addColumn("string", "Audit Type");
            dataTable.addColumn("number", "Count");
            dataTable.addRows(pieData);

            const options = {
                backgroundColor: "#1e1e1e",
                titleTextStyle: { color: "#ffffff" },
                legend: { textStyle: { color: "#ffffff" } },
                pieSliceTextStyle: { color: "#ffffff" },
                slices: {
                    0: { color: "#4CAF50" },
                    1: { color: "#FFC107" },
                },
                pieHole: 0.4,
                is3D: true,
            };

            const chart = new google.visualization.PieChart(
                document.getElementById("auditChart")
            );
            chart.draw(dataTable, options);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert(
            "An error occurred while fetching your data. Please try again later."
        );
    }
})();
