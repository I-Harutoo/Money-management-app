import React,{ useEffect, useMemo, useState } from "react";

const DEFAULT_CATEGORIES = ["食費", "交通費", "日用品", "娯楽", "学習", "その他"];

const yen = (value) => new Intl.NumberFormat("ja-JP").format(value) + "円";

function getMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function App() {
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem("money-manager-records");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedMonth, setSelectedMonth] = useState(getMonth());
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    return Number(localStorage.getItem("money-manager-budget")) || 100000;
  });

  useEffect(() => {
    localStorage.setItem("money-manager-records", JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem("money-manager-budget", String(monthlyBudget));
  }, [monthlyBudget]);

  const monthRecords = useMemo(
    () => records.filter((record) => record.date.startsWith(selectedMonth)),
    [records, selectedMonth]
  );

  const expenses = monthRecords.filter((record) => record.type === "expense");
  const incomes = monthRecords.filter((record) => record.type === "income");

  const totalExpense = expenses.reduce((sum, record) => sum + record.amount, 0);
  const totalIncome = incomes.reduce((sum, record) => sum + record.amount, 0);
  const balance = totalIncome - totalExpense;

  const categoryTotals = useMemo(() => {
    return DEFAULT_CATEGORIES.map((name) => ({
      name,
      total: expenses
        .filter((record) => record.category === name)
        .reduce((sum, record) => sum + record.amount, 0),
    })).filter((item) => item.total > 0);
  }, [expenses]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0 || !date) {
      alert("金額と日付を正しく入力してください。");
      return;
    }

    const newRecord = {
      id: crypto.randomUUID(),
      type,
      category: type === "income" ? "収入" : category,
      amount: numericAmount,
      memo: memo.trim(),
      date,
    };

    setRecords((current) => [newRecord, ...current]);
    setAmount("");
    setMemo("");
  };

  const deleteRecord = (id) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  };

  const expensePercentage = totalExpense > 0
    ? Math.round((totalExpense / monthlyBudget) * 100)
    : 0;

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">MONEY MANAGER</p>
          <h1>お金の使い方を、数字で見える化。</h1>
          <p className="subtitle">支出を記録すると、1か月の用途別割合を自動で集計します。</p>
        </div>

        <label className="month-picker">
          表示月
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          />
        </label>
      </header>

      <section className="summary-grid">
        <SummaryCard label="収入" value={yen(totalIncome)} />
        <SummaryCard label="支出" value={yen(totalExpense)} />
        <SummaryCard label="残高" value={yen(balance)} />
        <SummaryCard
          label="予算消化率"
          value={`${expensePercentage}%`}
          note={`予算 ${yen(monthlyBudget)}`}
        />
      </section>

      <div className="main-grid">
        <section className="card">
          <h2>お金を記録する</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="type-switch">
              <button
                type="button"
                className={type === "expense" ? "active" : ""}
                onClick={() => setType("expense")}
              >
                支出
              </button>
              <button
                type="button"
                className={type === "income" ? "active" : ""}
                onClick={() => setType("income")}
              >
                収入
              </button>
            </div>

            {type === "expense" && (
              <label>
                用途
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {DEFAULT_CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              金額
              <input
                type="number"
                min="1"
                placeholder="例：1200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <label>
              日付
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label>
              メモ（任意）
              <input
                type="text"
                placeholder="例：友達とランチ"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </label>

            <button className="submit-button" type="submit">記録する</button>
          </form>

          <div className="budget-setting">
            <label>
              月間予算
              <input
                type="number"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <h2>用途別の割合</h2>
              <p>{selectedMonth.replace("-", "年")}月の支出</p>
            </div>
            <strong>{yen(totalExpense)}</strong>
          </div>

          {categoryTotals.length === 0 ? (
            <div className="empty">この月の支出データがありません。</div>
          ) : (
            <div className="chart-area">
              <PieChart data={categoryTotals} total={totalExpense} />
              <div className="legend">
                {categoryTotals.map((item) => {
                  const percentage = Math.round((item.total / totalExpense) * 100);
                  return (
                    <div className="legend-row" key={item.name}>
                      <span>{item.name}</span>
                      <span>{yen(item.total)} / {percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="section-title">
          <div>
            <h2>今月の記録</h2>
            <p>新しい記録から表示しています。</p>
          </div>
          <span>{monthRecords.length}件</span>
        </div>

        {monthRecords.length === 0 ? (
          <div className="empty">まだ記録がありません。</div>
        ) : (
          <div className="record-list">
            {monthRecords.map((record) => (
              <article className="record" key={record.id}>
                <div>
                  <strong>{record.category}</strong>
                  <small>{record.date}{record.memo ? ` ・ ${record.memo}` : ""}</small>
                </div>
                <div className={record.type === "income" ? "income" : "expense"}>
                  {record.type === "income" ? "+" : "-"}{yen(record.amount)}
                  <button onClick={() => deleteRecord(record.id)}>削除</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value, note }) {
  return (
    <article className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function PieChart({ data, total }) {
  let current = 0;

  const segments = data.map((item) => {
    const start = current;
    const percentage = item.total / total;
    current += percentage;
    return { ...item, start, end: current };
  });

  const polar = (percentage, radius = 45) => {
    const angle = percentage * Math.PI * 2 - Math.PI / 2;
    return [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)];
  };

  const pathFor = (start, end) => {
    const [x1, y1] = polar(start);
    const [x2, y2] = polar(end);
    const largeArc = end - start > 0.5 ? 1 : 0;
    return `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <svg className="pie" viewBox="0 0 100 100" aria-label="用途別支出割合">
      {segments.map((segment) => (
        <path
          key={segment.name}
          d={pathFor(segment.start, segment.end)}
          className="pie-segment"
        />
      ))}
      <circle cx="50" cy="50" r="23" className="pie-hole" />
      <text x="50" y="49" textAnchor="middle" className="pie-number">{data.length}</text>
      <text x="50" y="57" textAnchor="middle" className="pie-label">用途</text>
    </svg>
  );
}

export default App;
