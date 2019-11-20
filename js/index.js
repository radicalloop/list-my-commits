const pageLength = 10;
const owner = 'radicalloop';
const repoName = 'list-my-commits';
const authToken = 'ea1d7a942ba9ceb30caebce353e3307128d90591';

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

  $('#commits-container').html(html);

}


$(document).ready(function(){

  getCommits('after');
});

