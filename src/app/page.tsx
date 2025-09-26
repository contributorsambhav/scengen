import Image from "next/image";
import ScenGenRailwayBuilder from "@/components/ScenGenRailwayBuilder";
import TrainSimulation from "@/components/TrainSimulation";

export default function Home() {
  return (
  <div>
    <ScenGenRailwayBuilder />
    <TrainSimulation />
  </div>
  );
}
