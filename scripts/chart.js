function rowParser(row) {
    if(!row.timestamp)
        throw new Error('Your csv file must have a row named "timestamp"');
    if(!row.value)
        throw new Error('Your csv file must have a row named "value"');

    return {
        date: new Date(row.timestamp),
        value: parseFloat(row.value)
    }
}

function processRows(rows) {
    const transactionsPerDay = rows.reduce((transactions, row) => {
        const y = row.date.getFullYear(),
              m = row.date.getMonth() + 1,
              d = row.date.getDate(),
              key = `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`

        if(!transactions[key])
            transactions[key] = [];

        transactions[key].push(row.value);

        return transactions;
    }, {})

    perDay = [];
    for(let date in transactionsPerDay) {
        perDay.push({
            date: new Date(date + "T00:00:00"),
            value: d3.sum(transactionsPerDay[date]),
            amount: transactionsPerDay[date].length
        });
    }

    return {
        rows,
        transactionsPerDay,
        perDay
    };
}

function renderGraph(data) {
    const container = document.getElementById("graph-container");
    console.log(container);
    const w = container.clientWidth;
    const h = container.clientHeight;
    const p = 40;

    const svg = d3.select("#chart")
        .attr("width", w)
        .attr("height", h);

    const legend = d3.select("#legend");

    // Scales
    const xScale = d3.scaleTime()
        .domain([
            d3.min(data.perDay, day => day.date),
            d3.max(data.perDay, day => day.date)
        ])
        .range([p, w - p]);


    console.log(d3.min(data.perDay, day => day.value),
    d3.max(data.perDay, day => day.value));

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(data.perDay, day => day.value),
            d3.max(data.perDay, day => day.value)
        ])
        .range([h - p, p]);

    const colorScale = d3.scaleLinear()
        .domain([
            d3.min(data.perDay, day => day.amount),
            d3.max(data.perDay, day => day.amount)
        ]);

    // Axis
    const xAxis = d3.axisBottom(xScale)
        .ticks(data.perDay.length)
        .tickFormat(d3.timeFormat("%m/%d"));
    const yAxis = d3.axisLeft(yScale);

    // Misc.
    const q = d3.quantile.bind(this, d3.extent(data.perDay.map(d => d.amount)));

    // Visualization
    svg.selectAll("rect")
        .data(data.perDay)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.date))
        .attr("y", d => yScale(d.value))
        .attr("width", (w - p) / data.perDay.length)
        .attr("height", d => h - p - yScale(d.value))
        .attr("title", d => d.amount + " transactions")
        .attr("fill", d => d3.interpolateInferno(colorScale(d.amount)));

    legend.append("span").text(`██ ${q(0)} `).attr("style", `color: ${d3.interpolateInferno(0)}`);
    legend.append("span").text(`██ ${q(0.25)} `).attr("style", `color: ${d3.interpolateInferno(0.25)}`);
    legend.append("span").text(`██ ${q(0.5)} `).attr("style", `color: ${d3.interpolateInferno(0.5)}`);
    legend.append("span").text(`██ ${q(0.75)} `).attr("style", `color: ${d3.interpolateInferno(0.75)}`);
    legend.append("span").text(`██ ${q(1)} `).attr("style", `color: ${d3.interpolateInferno(1)}`);

    svg.append("g")
        .attr("transform", `translate(0,${h - p})`)
        .call(xAxis);

    svg.append("g")
        .attr("transform", `translate(${p},0)`)
        .call(yAxis);

    // Axis labels
    svg.append("text")
        .style("text-anchor", "middle")
        .attr("x", (w - p) / 2)
        .attr("y", h)
        .text("Date");

    svg.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - (h / 2))
        .attr("y", p / 3)
        .text("Coins");

    d3.select("#average-transaction p")
        .text(d3.mean(data.rows, r => r.value));

    d3.select("#average-transactions-day p")
        .text(d3.mean(data.perDay, d => d.amount));

    d3.select("#daily-average p")
        .text(d3.mean(data.perDay, d => d.value));

    d3.select("#smallest-transaction p")
        .text(d3.min(data.rows, r => r.value));

    d3.select("#largest-transaction p")
        .text(d3.max(data.rows, r => r.value));
}

d3.csv("demo-history.csv", rowParser, function(rows) {
    const data = processRows(rows);
    renderGraph(data);
});
