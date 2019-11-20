var pageInfo = {};
const pageLength = 3;
const owner = 'radicalloop';
const repoName = 'list-my-commits';
const authToken = window.atob('ZGE2YzhkZmM5ZTQ5OWVjZDY3NmI3ZDQzM2E2YzBkZmRmNWExNTZmNA==');

function getQuery(direction, cursor = null)
{
  cursor = cursor ? `"${cursor}"` : null;
  const start = (direction == 'after') ? 'first' : 'last';
  return `
  {
    repository(owner: "${owner}", name: "${repoName}") {
      defaultBranchRef {
        target {
          ... on Commit {
            id
            history(${start}: ${pageLength}, ${direction}: ${cursor} ) {
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
              edges {
                node {
                  commitUrl
                  messageHeadline
                  oid
                  message
                  committedDate
                  author {
                    name
                    email
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  `;
}

async function getCommits(direction, cursor = null)
{
  let response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'Authorization': 'bearer ' + authToken },
    body: JSON.stringify({ query: 'query ' + getQuery(direction, cursor)}),
  });
  let data = await response.json();
  showCommits(data.data);
}

function showCommits(data)
{
  console.log(data);

  if (!validateData(data)) {
    return;
  }

  let history = data.repository.defaultBranchRef.target.history;
  let commitList = history.edges;
  let html = '';

  for (let i = 0; i < commitList.length; i++) {
    let commitObj = commitList[i];
    let commitHtml = $('<div/>').html($('#commit-info').html());
    let nodeObj = commitObj.node;

    let messageLink = $('<a>').attr({'href': nodeObj.commitUrl, 'target': '_blank', 'class': 'commit__url'}).html(nodeObj.messageHeadline);
    console.log(messageLink);

    $(commitHtml).find('.item-title').html(messageLink);
    $(commitHtml).find('.item-detail').html(nodeObj.message);
    $(commitHtml).find('.item-author').html(nodeObj.author.name + ' (' + nodeObj.author.email + ')');
    $(commitHtml).find('.timestamp').html(nodeObj.committedDate);

    html += $(commitHtml).html();
  }

  $('#commits-container').append(html);

  pageInfo = history.pageInfo;

  setNavLinksVisibility();
}

function validateData(data)
{
  if (!data || !data.repository || !data.repository.defaultBranchRef) {
    alert('no data to show');
    $('#commits-container').html('');
    setNavLinksVisibility();
    return false;
  }
  return true;
}

function setNavLinksVisibility()
{
  // (!pageInfo.hasPreviousPage) ? $('#prev').hide() : $('#prev').show();
  // (!pageInfo.hasNextPage) ? $('#next').hide() : $('#next').show();

  (!pageInfo.hasNextPage) ? $('#load_more').hide() : $('#load_more').show();
}

function next()
{
  getCommits('after', pageInfo.endCursor);
}

function previous()
{
  getCommits('before', pageInfo.startCursor);
}

$(document).ready(function(){
  // $('#next').on('click', next);
  // $('#prev').on('click', previous);

  $('#load_more').on('click', next);

  getCommits('after');
});


