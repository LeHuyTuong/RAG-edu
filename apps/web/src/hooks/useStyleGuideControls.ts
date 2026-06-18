"use client";

import { useState } from "react";

export interface UseStyleGuideControlsProps {
  readonly initialCity?: string;
}

export const useStyleGuideControls = ({
  initialCity = "Hà Nội",
}: UseStyleGuideControlsProps = {}) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("password123");
  const [email, setEmail] = useState("invalid-email");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState(initialCity);
  const [remember, setRemember] = useState(true);
  const [gender, setGender] = useState("male");
  const [switchOn, setSwitchOn] = useState(true);

  return {
    name,
    setName,
    password,
    setPassword,
    email,
    setEmail,
    search,
    setSearch,
    city,
    setCity,
    remember,
    setRemember,
    gender,
    setGender,
    switchOn,
    setSwitchOn,
  } as const;
};
