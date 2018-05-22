import * as posenet from '@tensorflow-models/posenet';
import React from 'react';
import styled from 'styled-components';

const Detect = styled.div`
  position: relative;
`
const Preview = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
`;
const Predictions = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
`;

class DetectComponent extends React.Component {
  constructor(props) {
    super(props);
    this.grabFrame = this.grabFrame.bind(this);
    this.detect = this.detect.bind(this);
  }

  async initPosenet() {
    this.posenet = await posenet.load();
  }

  async componentDidMount() {
    await this.initPosenet();

    this.color = '#' + ((1<<24)*Math.random()|0).toString(16);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    this.video = document.createElement('video');
    this.video.srcObject = stream;
  
    this.previewContext = this.preview.getContext('2d');
    this.predictionsContext = this.predictions.getContext('2d');

    this.video.addEventListener('canplay', () => {
      this.preview.width = this.video.videoHeight;
      this.preview.height = this.video.videoHeight;
      this.predictions.width = this.video.videoHeight;
      this.predictions.height = this.video.videoHeight;
      this.grabFrame();
      this.detect();
    });
  }

  grabFrame() {
    this.previewContext.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight, 0, 0, this.preview.width, this.preview.height);
    requestAnimationFrame(this.grabFrame);
  }

  async detect() {
    this.predictionsContext.clearRect(0, 0, this.predictions.width, this.predictions.height);
    await this.singlePose();
    requestAnimationFrame(this.detect);
  }

  drawPose(pose) {
    this.drawBoundingBox(this.predictionsContext, pose.keypoints, this.color);
    this.drawKeypoints(this.predictionsContext, pose.keypoints, 0.8, this.color);
    this.drawSkeleton(this.predictionsContext, pose.keypoints, 0.3, this.color);
  }

  async multiplePoses() {
    const poses = await this.posenet.estimateMultiplePoses(this.preview, 0.5, false, 16);
    poses.forEach(pose => this.drawPose(pose));
  }

  async singlePose() {
    const pose = await this.posenet.estimateSinglePose(this.preview, 0.5, false, 16);
    this.drawPose(pose);
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
        <Preview innerRef={preview => { this.preview = preview; }} />
        <Predictions innerRef={predictions => { this.predictions = predictions; }} />
      </Detect>
    );
  }
}

export default DetectComponent;
