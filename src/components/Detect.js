import * as posenet from '@tensorflow-models/posenet';
import React from 'react';
import styled from 'styled-components';
import Webcam from './Webcam';

const Detect = styled.div`
  position: relative;
`
const Predictions = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
`;

class DetectComponent extends React.Component {
  constructor(props) {
    super(props);
    this.grabFrame = this.grabFrame.bind(this);
  }

  async initPosenet() {
    this.posenet = await posenet.load();
  }

  async componentDidMount() {
    await this.initPosenet();

    this.color = '#' + ((1<<24)*Math.random()|0).toString(16);
    this.preview = document.createElement('canvas');
    this.previewContext = this.preview.getContext('2d');
    this.predictionsContext = this.predictions.getContext('2d');

    this.webcam.video.addEventListener('canplay', () => {
      this.preview.width = this.webcam.video.videoWidth;
      this.preview.height = this.webcam.video.videoHeight;
      this.predictions.width = this.webcam.video.videoWidth;
      this.predictions.height = this.webcam.video.videoHeight;
      this.grabFrame();
    });
  }

  async grabFrame() {
    this.previewContext.drawImage(this.webcam.video, 0, 0, this.preview.width, this.preview.height);
    
    const pose = await this.posenet.estimateSinglePose(this.preview, 0.5, false, 16);
    this.predictionsContext.clearRect(0, 0, this.predictions.width, this.predictions.height);
    this.drawBoundingBox(this.predictionsContext, pose.keypoints, this.color);
    this.drawKeypoints(this.predictionsContext, pose.keypoints, 0.5, this.color);
    this.drawSkeleton(this.predictionsContext, pose.keypoints, 0.5, this.color);

    requestAnimationFrame(this.grabFrame);
  }

  drawKeypoints(context, keypoints, minConfidence, color) {
    keypoints.forEach((keypoint) => {
      if (keypoint.score < minConfidence) {
        return;
      }

      const { y, x } = keypoint.position;
      context.beginPath();
      context.arc(x, y, 3, 0, 2 * Math.PI);
      context.fillStyle = color;
      context.fill();
    });
  }

  drawBoundingBox(context, keypoints, color) {
    const box = posenet.getBoundingBox(keypoints);

    context.lineWidth = 4;
    context.strokeStyle = color;
    context.strokeRect(
      box.minX,
      box.minY,
      box.maxX - box.minX,
      box.maxY - box.minY,
    );
  }

  drawSegment(context, [ay, ax], [by, bx], color) {
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.lineWidth = 2;
    context.strokeStyle = color;
    context.stroke();
  }

  drawSkeleton(context, keypoints, minConfidence, color) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
      this.drawSegment(context, this.toTuple(keypoints[0].position), this.toTuple(keypoints[1].position), color);
    });
  }

  toTuple({ y, x }) {
    return [y, x];
  }

  render() {
    return (
      <Detect>
        <Webcam ref={webcam => { this.webcam = webcam; }} />
        <Predictions innerRef={predictions => { this.predictions = predictions; }} />
      </Detect>
    );
  }
}

export default DetectComponent;
