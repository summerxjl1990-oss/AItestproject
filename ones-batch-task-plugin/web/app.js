const $ = (id) => document.getElementById(id);

const state = {
  items: [],
};

function setDefaultBaseUrl() {
  if (!$("baseUrl").value) {
    $("baseUrl").value = window.location.origin;
  }
}

function parseLines(text) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, idx) => {
    const parts = line.split("|").map((p) => p.trim());
    const title = parts[0] || "";
    const description = parts[1] || "";
    const assigneeUuid = parts[2] || "";
    const dueDate = parts[3] || "";

    return {
      row: idx + 1,
      title,
      description,
      assigneeUuid,
      dueDate,
      ok: Boolean(title),
      message: title ? "待创建" : "标题不能为空",
      issueUuid: "",
    };
  });
}

function renderTable(items) {
  const body = $("resultBody");
  body.innerHTML = "";

  items.forEach((it) => {
    const tr = document.createElement("tr");
    const badge = it.ok
      ? '<span class="badge ok">成功</span>'
      : it.message === "待创建"
      ? '<span class="badge">待创建</span>'
      : '<span class="badge err">失败</span>';

    tr.innerHTML = `
      <td>${it.row}</td>
      <td>${escapeHtml(it.title)}</td>
      <td>${escapeHtml(it.assigneeUuid || "-")}</td>
      <td>${escapeHtml(it.dueDate || "-")}</td>
      <td>${badge}</td>
      <td>${escapeHtml(it.message || "")}${
      it.issueUuid ? `<br/><small>${escapeHtml(it.issueUuid)}</small>` : ""
    }</td>
    `;
    body.appendChild(tr);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function status(text) {
  $("status").textContent = text;
}

function buildPayload(item, issueTypeUuid, defaultAssigneeUuid) {
  const payload = {
    title: item.title,
    description: item.description,
    issue_type_uuid: issueTypeUuid,
  };

  const owner = item.assigneeUuid || defaultAssigneeUuid;
  if (owner) {
    payload.owner = owner;
  }

  if (item.dueDate) {
    payload.field_values = [
      {
        field_uuid: "field013",
        value: item.dueDate,
      },
    ];
  }

  return payload;
}

async function createOne({ baseUrl, token, pathTemplate, projectUuid, issueTypeUuid, defaultAssigneeUuid, item }) {
  const apiPath = pathTemplate.replace("{project_uuid}", projectUuid);
  const url = `${baseUrl.replace(/\/$/, "")}${apiPath}`;
  const payload = buildPayload(item, issueTypeUuid, defaultAssigneeUuid);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  }

  return data;
}

async function createAll() {
  const baseUrl = $("baseUrl").value.trim();
  const token = $("token").value.trim();
  const projectUuid = $("projectUuid").value.trim();
  const issueTypeUuid = $("issueTypeUuid").value.trim();
  const defaultAssigneeUuid = $("defaultAssigneeUuid").value.trim();
  const pathTemplate = $("apiPathTemplate").value.trim();

  if (!baseUrl || !token || !projectUuid || !issueTypeUuid || !pathTemplate) {
    status("请补充连接配置中的必填项");
    return;
  }

  const total = state.items.length;
  if (!total) {
    status("请先输入并预览任务");
    return;
  }

  status(`开始创建，共 ${total} 条...`);

  for (let i = 0; i < state.items.length; i += 1) {
    const item = state.items[i];
    if (!item.title) {
      item.ok = false;
      item.message = "标题不能为空";
      continue;
    }

    try {
      const data = await createOne({
        baseUrl,
        token,
        pathTemplate,
        projectUuid,
        issueTypeUuid,
        defaultAssigneeUuid,
        item,
      });

      item.ok = true;
      item.issueUuid = data?.uuid || data?.issue_uuid || "";
      item.message = "创建成功";
    } catch (err) {
      item.ok = false;
      item.message = err?.message || "创建失败";
    }

    status(`进行中：${i + 1}/${total}`);
    renderTable(state.items);
  }

  const okCount = state.items.filter((x) => x.ok).length;
  status(`创建完成：成功 ${okCount}，失败 ${total - okCount}`);
}

function bindEvents() {
  $("previewBtn").addEventListener("click", () => {
    state.items = parseLines($("bulkInput").value);
    renderTable(state.items);
    status(`预览完成，共 ${state.items.length} 条`);
  });

  $("createBtn").addEventListener("click", () => {
    createAll();
  });
}

setDefaultBaseUrl();
bindEvents();
