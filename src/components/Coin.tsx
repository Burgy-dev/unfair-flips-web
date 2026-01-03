type CoinProps = {
  isFlipping: boolean;
  side: "heads" | "tails";
  flipTimeSeconds: number;
  sizePx: number;
  color: string;
};

export default function Coin({
  isFlipping,
  side,
  flipTimeSeconds,
  sizePx,
  color,
}: CoinProps) {
  return (
    <div
      className="coin-scene"
      style={
        {
          "--coin-size": `${sizePx}px`,
          "--coin-color": color,
          "--flip-duration": `${flipTimeSeconds}s`,
        } as React.CSSProperties
      }
    >
      <div className={["coin-hop", isFlipping ? "coin-hop--flipping" : ""].join(" ")}>
        <div
          className={[
            "coin",
            isFlipping ? "coin--spinning" : "",
            side === "heads" ? "coin--heads" : "coin--tails",
          ].join(" ")}
        >
          <div className="coin-face coin-face--heads">H</div>
          <div className="coin-face coin-face--tails">T</div>
        </div>
      </div>
    </div>
  );
}
