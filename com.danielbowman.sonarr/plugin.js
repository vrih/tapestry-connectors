function getData(path, method = 'GET', body = null) {
  const headers = { "X-Api-Key": apiKey, "accept": "application/json" };
  return sendRequest(path, method, body, headers);
}

function getPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function extractImageUrl(images) {
  return images && images[0] && images[0].remoteUrl;
}

async function load() {
  try {
    const daysAgo = 10;
    const endpoint = `${site}/api/v3/history/since?eventType=downloadFolderImported&date=${getPastDate(daysAgo)}`;

    const responseText = await getData(endpoint);
    const historyEntries = JSON.parse(responseText);

    const items = await Promise.all(
      historyEntries.map(async (el) => {
        const episodeUrl = `${site}/api/v3/episode/${el.episodeId}`;
        const episodeResponse = await getData(episodeUrl);
        const episode = JSON.parse(episodeResponse);
        const episodeUiUrl = `${site}/series/${episode.series.titleSlug}#${el.episodeId}`

        const itemDate = new Date(el.date);
        const elUri = `${endpoint}&id=${el.id}`;
        const item = Item.createWithUriDate(episodeUiUrl, itemDate);

        item.title = `${episode.series.title} - ${episode.title} S${episode.seasonNumber}E${episode.episodeNumber}`;
        item.body = `<p>${episode.overview}</p>`;

        const imageUrl = extractImageUrl(episode.images);
        if (imageUrl) {
          const mediaAttachment = MediaAttachment.createWithUrl(imageUrl);
          item.attachments = [mediaAttachment];
        }

        return item;
      })
    );

    processResults(items);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Failed to parse JSON:', error);
    } else {
      console.error('Error occurred:', error);
    }
    processError(error);
  }
}

async function verify() {
  try {
    const url = `${site}/api/v3/ping`;
    const response = await getData(url);
    JSON.parse(response);
    processVerification("Healthchecks");
  } catch (error) {
    processError(error);
  }
}
