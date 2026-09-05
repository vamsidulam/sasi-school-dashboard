export default function SpeederLoader({ label = 'Loading' }) {
  return (
    <div className="speeder-loader">
      <div className="speeder-body">
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className="speeder-base">
          <span></span>
          <div className="speeder-face"></div>
        </div>
      </div>
      <div className="speeder-longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="speeder-label">{label}</p>

      <style>{`
        .speeder-loader {
          position: relative;
          width: 100%;
          height: 120px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .speeder-label {
          position: absolute;
          font-family: inherit;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          left: 50%;
          top: 62%;
          transform: translateX(-50%);
          color: #555;
          letter-spacing: 0.5px;
        }
        .speeder-body {
          position: absolute;
          top: 50%;
          left: 50%;
          margin-left: -50px;
          animation: speeder-shake 0.4s linear infinite;
        }
        .speeder-body > span {
          height: 5px;
          width: 35px;
          background: #333;
          position: absolute;
          top: -19px;
          left: 60px;
          border-radius: 2px 10px 1px 0;
        }
        .speeder-body > span > span {
          width: 30px;
          height: 1px;
          background: #333;
          position: absolute;
          animation: speeder-fazer1 0.2s linear infinite;
        }
        .speeder-body > span > span:nth-child(2) {
          top: 3px;
          animation: speeder-fazer2 0.4s linear infinite;
        }
        .speeder-body > span > span:nth-child(3) {
          top: 1px;
          animation: speeder-fazer3 0.4s linear infinite;
          animation-delay: -1s;
        }
        .speeder-body > span > span:nth-child(4) {
          top: 4px;
          animation: speeder-fazer4 1s linear infinite;
          animation-delay: -1s;
        }
        .speeder-base span {
          position: absolute;
          width: 0;
          height: 0;
          border-top: 6px solid transparent;
          border-right: 100px solid #333;
          border-bottom: 6px solid transparent;
        }
        .speeder-base span::before {
          content: "";
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: #333;
          position: absolute;
          right: -110px;
          top: -16px;
        }
        .speeder-base span::after {
          content: "";
          position: absolute;
          width: 0;
          height: 0;
          border-top: 0 solid transparent;
          border-right: 55px solid #333;
          border-bottom: 16px solid transparent;
          top: -16px;
          right: -98px;
        }
        .speeder-face {
          position: absolute;
          height: 12px;
          width: 20px;
          background: #333;
          border-radius: 20px 20px 0 0;
          transform: rotate(-40deg);
          right: -125px;
          top: -15px;
        }
        .speeder-face::after {
          content: "";
          height: 12px;
          width: 12px;
          background: #333;
          right: 4px;
          top: 7px;
          position: absolute;
          transform: rotate(40deg);
          transform-origin: 50% 50%;
          border-radius: 0 0 0 2px;
        }
        .speeder-longfazers {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .speeder-longfazers span {
          position: absolute;
          height: 2px;
          width: 20%;
          background: #333;
        }
        .speeder-longfazers span:nth-child(1) {
          top: 20%;
          animation: speeder-lf 0.6s linear infinite;
          animation-delay: -5s;
        }
        .speeder-longfazers span:nth-child(2) {
          top: 40%;
          animation: speeder-lf2 0.8s linear infinite;
          animation-delay: -1s;
        }
        .speeder-longfazers span:nth-child(3) {
          top: 60%;
          animation: speeder-lf3 0.6s linear infinite;
        }
        .speeder-longfazers span:nth-child(4) {
          top: 80%;
          animation: speeder-lf4 0.5s linear infinite;
          animation-delay: -3s;
        }
        @keyframes speeder-shake {
          0% { transform: translate(2px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -3px) rotate(-1deg); }
          20% { transform: translate(-2px, 0px) rotate(1deg); }
          30% { transform: translate(1px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 3px) rotate(-1deg); }
          60% { transform: translate(-1px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-2px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 1px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        @keyframes speeder-fazer1 {
          0% { left: 0; }
          100% { left: -80px; opacity: 0; }
        }
        @keyframes speeder-fazer2 {
          0% { left: 0; }
          100% { left: -100px; opacity: 0; }
        }
        @keyframes speeder-fazer3 {
          0% { left: 0; }
          100% { left: -50px; opacity: 0; }
        }
        @keyframes speeder-fazer4 {
          0% { left: 0; }
          100% { left: -150px; opacity: 0; }
        }
        @keyframes speeder-lf {
          0% { left: 200%; }
          100% { left: -200%; opacity: 0; }
        }
        @keyframes speeder-lf2 {
          0% { left: 200%; }
          100% { left: -200%; opacity: 0; }
        }
        @keyframes speeder-lf3 {
          0% { left: 200%; }
          100% { left: -100%; opacity: 0; }
        }
        @keyframes speeder-lf4 {
          0% { left: 200%; }
          100% { left: -100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
