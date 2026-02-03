export default function CosmiLoader({
  size = 1,
}: {
  size?: number;
}) {
  return (
    <div
      className="cosmi-loader"
      style={{ ["--size" as any]: size }}
    >
      <svg width="0" height="0">
        <defs>
          <mask id="clipping">
            <polygon points="50,0 100,50 50,100 0,50" fill="white" />
            <polygon points="20,20 80,20 80,80 20,80" fill="white" />
            <polygon points="50,10 90,50 50,90 10,50" fill="white" />
            <polygon points="30,30 70,30 70,70 30,70" fill="white" />
            <polygon points="40,40 60,40 60,60 40,60" fill="white" />
            <polygon points="10,50 50,10 90,50 50,90" fill="white" />
            <polygon points="25,50 50,25 75,50 50,75" fill="white" />
          </mask>
        </defs>
      </svg>

      <div className="box" />
    </div>
  );
}
