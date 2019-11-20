var pageInfo = {};
const pageLength = 3;
const owner = 'radicalloop';
const repoName = 'list-my-commits';
const authToken = '56cf37f176fe0bbdcffdea34176101a9e403b615';

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

  var history = data.repository.defaultBranchRef.target.history;
  var commitList = history.edges;
  var html = '';

  for (let i = 0; i < commitList.length; i++) {
    var commitObj = commitList[i];
    var commitHtml = $('<div/>').html($('#commit-info').html());
    $(commitHtml).find('.item-title').html(commitObj.node.messageHeadline);
    $(commitHtml).find('.item-detail').html(commitObj.node.message);
    $(commitHtml).find('.timestamp').html(commitObj.node.committedDate);
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


