import React from 'react';

// Define the type to control the props that can be passed to the YouTubeEmbed component.
type YouTubeEmbedProps = {
  // The YouTube video Id to embed.
  videoId: string;
  // The title of the YouTube video for accessibility.
  title: string;
};

// YouTubeEmbed component that accepts the specified props.
export default function YouTubeEmbed({ videoId, title = 'YouTube video player' }: YouTubeEmbedProps) {
  if (videoId) {
    return (
      <iframe
        width="100%"
        style={{ aspectRatio: '16 / 9' }}
        src={`https://youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    );
  }

  return null;
}
