import { useEffect, useRef, useState } from "react";
import './App.css'
import HistoryLog from './components/HistoryLog'
import Coin from './components/Coin'

function App() {
  const [headsChance, setHeadsChance] = useState(20)
  const [flipTime, setFlipTime] = useState(2.0)
  const [comboMult, setComboMult] = useState(1.0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [currentMoneyCents, setCurrentMoneyCents] = useState(0)
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads')
  const [isFlipping, setIsFlipping] = useState(false)
  const [history, setHistory] = useState<string[]>([]);
  const streakRef = useRef(0);

  const [chanceCostIndex, setChanceCostIndex] = useState(0)
  const [timeCostIndex, setTimeCostIndex] = useState(0)
  const [multCostIndex, setMultCostIndex] = useState(0)
  const [valueCostIndex, setValueCostIndex] = useState(0)

  const chanceCostScalingCents = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 0]
  const timeCostScalingCents = [1, 10, 100, 1000, 10000, 0]
  const multCostScalingCents = [1, 10, 100, 1000, 10000, 0]
  const valueCostScalingCents = [25, 100, 625, 10000, 0]

  const chanceCost = chanceCostScalingCents[chanceCostIndex];
  const timeCost = timeCostScalingCents[timeCostIndex];
  const multCost = multCostScalingCents[multCostIndex];
  const valueCost = valueCostScalingCents[valueCostIndex];

  const valueScalingCents = [1, 5, 10, 25, 100];
  const [valueIndex, setValueIndex] = useState(0);
  const baseCoinValueCents = valueScalingCents[valueIndex];

  type CoinTier = {
    name: "penny" | "nickel" | "dime" | "quarter" | "dollar";
    sizePx: number;
    color: string;
  };

  const coinTiersByValueIndex: CoinTier[] = [
    { name: "penny",   sizePx: 110, color: "#8B5A2B" },
    { name: "nickel",  sizePx: 170, color: "#C0C0C0" },
    { name: "dime",    sizePx: 140, color: "#D0D0D0" },
    { name: "quarter", sizePx: 210, color: "#C8C8C8" },
    { name: "dollar",  sizePx: 210, color: "#FFD700" },
  ];

  const coinTier = coinTiersByValueIndex[valueIndex];
  const coinSizePx = coinTier.sizePx;
  const coinColor = coinTier.color;

  const comboMultiplierRef = useRef(comboMult);
  const baseValueRef = useRef(baseCoinValueCents);

  const [showRickroll, setShowRickroll] = useState(false);
  const hasTriggeredRickrollRef = useRef(false);

  const flipSoundRef = useRef<HTMLAudioElement | null>(null);
  const landSoundRef = useRef<HTMLAudioElement | null>(null);
  const chachingSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL; // "/" locally, "/repo-name/" on gh-pages

    flipSoundRef.current = new Audio(`${base}sfx/coin_flip.mp3`);
    landSoundRef.current = new Audio(`${base}sfx/coin_land.mp3`);
    chachingSoundRef.current = new Audio(`${base}sfx/chaching.mp3`);

    flipSoundRef.current.volume = 0.4;
    landSoundRef.current.volume = 0.7;
    chachingSoundRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    comboMultiplierRef.current = comboMult;
  }, [comboMult]);

  useEffect(() => {
    baseValueRef.current = baseCoinValueCents;
  }, [baseCoinValueCents]);

  useEffect(() => {
    streakRef.current = currentStreak;
  }, [currentStreak]);

  type FloatPopup = {
    id: number;
    labelLine1: string;
    labelLine2: string;
  };

  const [floatPopups, setFloatPopups] = useState<FloatPopup[]>([]);
  const nextPopupIdRef = useRef(1);

  function addFloatPopup(labelLine1: string, labelLine2: string) {
    const id = nextPopupIdRef.current++;
    const newPopup: FloatPopup = { id, labelLine1, labelLine2 };

    setFloatPopups(previous => [...previous, newPopup]);

    window.setTimeout(() => {
      setFloatPopups(previous => previous.filter(popup => popup.id !== id));
    }, 950);
  }

  function formatMoney(cents: number) {
    return (cents / 100).toFixed(2);
  }

  function playSound(sound: HTMLAudioElement | null) {
    if (!sound) return;
    sound.currentTime = 0;
    void sound.play().catch(() => {
      // Browser blocked autoplay until user interaction.
      // Your button click counts as interaction, so this usually won’t happen.
    });
  }

  function flipCoin() {
    if (isFlipping) return
    setIsFlipping(true)
    playSound(flipSoundRef.current);

    setTimeout(() => {
      playSound(landSoundRef.current);
      const roll = Math.floor(Math.random() * 100); // 0..99
      const newSide = roll < headsChance ? "heads" : "tails";

      setCoinSide(newSide)

      const previousStreak = streakRef.current;
      const nextStreak = newSide === "heads" ? previousStreak + 1 : 0;

      setCurrentStreak(nextStreak);

      if (nextStreak >= 10 && !hasTriggeredRickrollRef.current) {
        hasTriggeredRickrollRef.current = true;
        setShowRickroll(true);
      }

      if (newSide === "heads") {
        const baseCoinValue = baseValueRef.current;
        const comboMultiplier = comboMultiplierRef.current;

        // streak 1 => base * ceil(mult^0) = base * 1
        // streak 2 => base * ceil(mult^1)
        // streak 3 => base * ceil(mult^2)
        const exponent = nextStreak - 1;
        const multiplierPower = Math.pow(comboMultiplier, exponent);

        let earnings = baseCoinValue * Math.ceil(multiplierPower);
        setCurrentMoneyCents(previousMoney => previousMoney + earnings);

        const streakNumber = nextStreak;

        addFloatPopup(
          `HEADS ${streakNumber}X`,
          `+$${formatMoney(earnings)}`
        );

        const headsLabel =
          nextStreak >= 2 ? "HEADS" + "!".repeat(nextStreak - 1) : "HEADS";

        setHistory(previousHistory => [
          ...previousHistory,
          `${headsLabel}\n----`,
        ]);
      } else {
        addFloatPopup("TAILS", "");
        setHistory(prev => [...prev, "TAILS\n----"]);
      }

      setIsFlipping(false)
    }, flipTime * 1000)
  }

  return (
    <>
      {showRickroll && (
        <div className="rickroll-overlay">
          <img className="rickroll-gif" src={`${import.meta.env.BASE_URL}rickroll.gif`} alt="rickroll" />
        </div>
      )}

      <div className="container">
        <div className="pane">
          <div style={{backgroundColor: '#000', padding: '10px', borderRadius: '8px', marginBottom: '10px'}}>
            <h1>HEADS CHANCE: {headsChance}%</h1>
          </div>
          <div className="coin-launch-area">
            <div className="float-popup-layer">
              {floatPopups.map(popup => (
                <div key={popup.id} className="float-popup">
                  <div className="float-popup__line1">{popup.labelLine1}</div>
                  <div className="float-popup__line2">{popup.labelLine2}</div>
                </div>
              ))}
            </div>

            <Coin
              isFlipping={isFlipping}
              side={coinSide}
              flipTimeSeconds={flipTime}
              sizePx={coinSizePx}
              color={coinColor}
            />
          </div>

          <div className="flip-controls">
            <button disabled={isFlipping} onClick={() => flipCoin()}>
              {isFlipping ? "FLIPPING..." : "FLIP"}
            </button>
          </div>
        </div>
        <div className="pane">
          <HistoryLog entries={history} />
        </div>
        <div className="pane">
          <div style={{backgroundColor: '#000', padding: '10px', borderRadius: '8px', marginBottom: '10px'}}>
            <h1>${formatMoney(currentMoneyCents)}</h1>
          </div>
          <div className="button-group">
            <button 
              disabled={chanceCostIndex >= chanceCostScalingCents.length - 1 || currentMoneyCents < chanceCost}
              onClick={() => {
                playSound(chachingSoundRef.current);
                const cost = chanceCostScalingCents[chanceCostIndex];
                if (currentMoneyCents < cost) return;

                setCurrentMoneyCents(prevMoney => prevMoney - cost);
                setChanceCostIndex(prevIndex => prevIndex + 1);
                setHeadsChance(prevChance => Math.min(100, prevChance + 5));
              }}
            > {chanceCost == 0 ? "+5% HEADS CHANCE\nMAX LEVEL" : `+5% HEADS CHANCE\n\$${formatMoney(chanceCost)}`}</button>
            <button
              disabled={timeCostIndex >= timeCostScalingCents.length - 1|| currentMoneyCents < timeCost}
              onClick={() => {
                playSound(chachingSoundRef.current);
                const cost = timeCostScalingCents[timeCostIndex];
                if (currentMoneyCents < cost) return;

                setCurrentMoneyCents(prevMoney => prevMoney - cost);
                setTimeCostIndex(prevIndex => prevIndex + 1);
                setFlipTime(prevTime => Math.max(0.1, prevTime - 0.2));
              }}
            > {timeCost == 0 ? "-0.2 SECONDS FLIP TIME\nMAX LEVEL" : `-0.2 SECONDS FLIP TIME\n\$${formatMoney(timeCost)}`}</button>
            <button
              disabled={multCostIndex >= multCostScalingCents.length - 1 || currentMoneyCents < multCost}
              onClick={() => {
                playSound(chachingSoundRef.current);
                const cost = multCostScalingCents[multCostIndex];
                if (currentMoneyCents < cost) return;

                setCurrentMoneyCents(prevMoney => prevMoney - cost);
                setMultCostIndex(prevIndex => prevIndex + 1);
                setComboMult(prevMult => prevMult + 0.5);
                
                setHistory(previousHistory => [
                  ...previousHistory,
                  `HEADS COMBO MULTIPLIER IS NOW ${comboMult + 0.5}X PER HEADS IN A ROW\n----`,
                ]);
              }}
            > {multCost == 0 ? "+0.5X HEADS COMBO MULT\nMAX LEVEL" : `+0.5X HEADS COMBO MULT\n\$${formatMoney(multCost)}`}</button>
            <button
              disabled={valueCostIndex >= valueCostScalingCents.length - 1 || currentMoneyCents < valueCost}
              onClick={() => {
                playSound(chachingSoundRef.current);
                const cost = valueCostScalingCents[valueCostIndex];
                if (currentMoneyCents < cost) return;

                setCurrentMoneyCents(prevMoney => prevMoney - cost);
                setValueCostIndex(prevIndex => prevIndex + 1);
                setValueIndex(prevIndex => prevIndex + 1);
              }}
            > {valueCost == 0 ? "UPGRADE BASE COIN WORTH\nMAX LEVEL" : `UPGRADE BASE COIN WORTH\n\$${formatMoney(valueCost)}`}</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
