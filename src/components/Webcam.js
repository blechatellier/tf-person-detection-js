import React from 'react';
import styled from 'styled-components';

const Video = styled.video``;

class Webcam extends React.Component {
  async componentDidMount() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.video.srcObject = stream;
    } catch (err) {
      console.error(err);
    } 
  }

  render() {
    return (
      <Video innerRef={video => { this.video = video; }} autoPlay />
    );
  }
}

export default Webcam;
