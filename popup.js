// popup.js
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

function formatJiraInfo({ url, key, summary }) {
  return `${key}: ${summary}\n${url}`;
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: () => {
        // Try Jira Cloud DOM selectors
        let key = "";
        let summary = "";
        // Try new Jira issue view
        const keyElem = document.querySelector('[data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"]') ||
                        document.querySelector('[data-test-id="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"]');
        if (keyElem) key = keyElem.textContent.trim();
        // Try summary
        const summaryElem = document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]') ||
                            document.querySelector('[data-test-id="issue.views.issue-base.foundation.summary.heading"]') ||
                            document.querySelector('h1[data-test-id="issue.views.issue-base.foundation.summary.heading"]');
        if (summaryElem) summary = summaryElem.textContent.trim();
        // Fallbacks
        if (!key) {
          // Try classic Jira
          const classicKey = document.querySelector('#key-val');
          if (classicKey) key = classicKey.textContent.trim();
        }
        if (!summary) {
          const classicSummary = document.querySelector('#summary-val');
          if (classicSummary) summary = classicSummary.textContent.trim();
        }
        return { url: window.location.href, key, summary };
      }
    },
    (results) => {
      if (results && results[0] && results[0].result) {
        const info = results[0].result;
        if (info.key && info.summary) {
          // Remove querystring from URL
          info.url = info.url.split('?')[0];
          copyToClipboard(formatJiraInfo(info));
        } else {
          document.getElementById('status').textContent = "Not a Jira issue page!";
        }
      } else {
        document.getElementById('status').textContent = "Failed to extract info!";
      }
    }
  );
});
