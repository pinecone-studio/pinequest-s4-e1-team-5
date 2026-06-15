import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture, Html, useCursor } from "@react-three/drei";
import * as THREE from "three";
const PAPER_WIDTH = 1.51;
const PAPER_HEIGHT = 1.7;
const FONT_PATH = "/fonts/CabinSketch-Regular.ttf";
const InteractiveTextField = ({
  isActive,
  value,
  placeholder,
  cursor,
  position,
  baseRotation,
  hitboxPosition,
  hitboxSize,
  fontSize,
  maxWidth,
  anchorX = "left",
  anchorY = "middle",
  fontPath,
  textAlign,
  lineHeight,
  onClick,
}) => {
  const textRef = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const targetY = hovered ? position[1] + 0.007 : position[1];
  const targetRotZ = hovered ? baseRotation[2] + 0.015 : baseRotation[2];
  useFrame((state, delta) => {
    const t = delta * 12;
    if (textRef.current) {
      textRef.current.position.y = THREE.MathUtils.lerp(
        textRef.current.position.y,
        targetY,
        t,
      );
      textRef.current.rotation.z = THREE.MathUtils.lerp(
        textRef.current.rotation.z,
        targetRotZ,
        t,
      );
    }
  });
  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
    >
      {}
      <mesh position={hitboxPosition} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={hitboxSize} />
        <meshBasicMaterial
          color="#e0e0e0"
          colorWrite={false}
          depthWrite={false}
        />
      </mesh>

      <Text
        renderOrder={1}
        ref={textRef}
        position={position}
        rotation={baseRotation}
        fontSize={fontSize}
        color={hovered ? "#111111" : "#333333"}
        font={fontPath}
        anchorX={anchorX}
        anchorY={anchorY}
        maxWidth={maxWidth}
        textAlign={textAlign}
        lineHeight={lineHeight}
      >
        {isActive ? value + cursor : value || placeholder}
      </Text>
    </group>
  );
};
const SmoothButton = ({ texture, onClick, position, size, text, fontPath }) => {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const targetY = hovered ? position[1] + 0.007 : position[1];
  const targetRotZ = hovered ? 0.015 : 0;
  useFrame((state, delta) => {
    const t = delta * 12;
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        t,
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        targetRotZ,
        t,
      );
      groupRef.current.scale.set(1, 1, 1);
    }
  });
  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={size} />
        <meshBasicMaterial
          color="#e0e0e0"
          map={texture}
          transparent
          alphaTest={0.1}
        />
      </mesh>
      {text && (
        <Text
          renderOrder={1}
          position={[0, 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.06}
          color="#333333"
          font={fontPath}
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      )}
    </group>
  );
};
const WEB3FORMS_KEY = "2ceaee50-a31e-4936-98fc-ca9648b21cdd";
const MessagePaper = ({ position = [0, 0.05, 2], onSend }) => {
  const groupRef = useRef();
  const paperRef = useRef();
  const backPaperRef = useRef();
  const hiddenInputRef = useRef();
  const emailInputRef = useRef();
  const subjectInputRef = useRef();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [activeField, setActiveField] = useState(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email required";
    else if (!isValidEmail(email)) newErrors.email = "Invalid email format";
    if (!subject.trim()) newErrors.subject = "Subject required";
    if (!message.trim()) newErrors.message = "Message required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const paperTexture = useTexture("/textures/contact/paper_form.webp");
  const buttonTexture = useTexture("/textures/contact/send_button.webp");
  useEffect(() => {
    if (paperTexture) paperTexture.colorSpace = THREE.SRGBColorSpace;
    if (buttonTexture) buttonTexture.colorSpace = THREE.SRGBColorSpace;
  }, [paperTexture, buttonTexture]);
  useEffect(() => {
    if (!activeField) {
      setCursorVisible(false);
      return;
    }
    const interval = setInterval(() => setCursorVisible((prev) => !prev), 530);
    return () => clearInterval(interval);
  }, [activeField]);
  const handlePaperClick = useCallback((e) => {
    e.stopPropagation();
    if (!e.uv) return;
    const uvY = e.uv.y;
    if (uvY > 0.82) {
      setActiveField("email");
      setTimeout(() => emailInputRef.current?.focus(), 10);
    } else if (uvY > 0.68) {
      setActiveField("subject");
      setTimeout(() => subjectInputRef.current?.focus(), 10);
    } else if (uvY > 0.18) {
      setActiveField("message");
      setTimeout(() => hiddenInputRef.current?.focus(), 10);
    }
  }, []);
  const handleButtonClick = useCallback(async () => {
    setSubmitStatus(null);
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          from_name: "Portfolio Contact",
          email: email,
          subject: subject,
          message: message,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitStatus("success");
        onSend?.({
          message,
          email,
          subject,
        });
        setMessage("");
        setEmail("");
        setSubject("");
      } else {
        throw new Error(result.message || "Failed to send");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }, [message, email, subject, onSend, validateForm]);
  const handleMessageInput = useCallback((e) => {
    if (e.target.value.length <= 300) setMessage(e.target.value);
  }, []);
  const handleEmailInput = useCallback((e) => {
    if (e.target.value.length <= 50) setEmail(e.target.value);
  }, []);
  const handleSubjectInput = useCallback((e) => {
    if (e.target.value.length <= 50) setSubject(e.target.value);
  }, []);
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      const active = document.activeElement;
      if (
        active !== hiddenInputRef.current &&
        active !== emailInputRef.current &&
        active !== subjectInputRef.current
      ) {
        setActiveField(null);
      }
    }, 100);
  }, []);
  const formattedMessage = useMemo(() => {
    const maxCharsPerLine = 28;
    const maxLines = 10;
    const lines = [];
    const words = message.split(" ");
    let currentLine = "";
    const breakLongWord = (word) => {
      const chunks = [];
      while (word.length > maxCharsPerLine) {
        chunks.push(word.slice(0, maxCharsPerLine));
        word = word.slice(maxCharsPerLine);
      }
      if (word) chunks.push(word);
      return chunks;
    };
    words.forEach((word) => {
      if (word.length > maxCharsPerLine) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        const brokenWord = breakLongWord(word);
        brokenWord.forEach((chunk, i) => {
          if (i < brokenWord.length - 1) lines.push(chunk);
          else currentLine = chunk;
        });
      } else if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + " " + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, maxLines).join("\n");
  }, [message]);
  useFrame((state, delta) => {
    if (!paperRef.current) return;
    const time = state.clock.getElapsedTime();
    paperRef.current.rotation.z = Math.sin(time * 0.5) * 0.005;
  });
  return (
    <group ref={groupRef} position={position}>
      {}
      <Html
        position={[0, 0, 0]}
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <textarea
          ref={hiddenInputRef}
          value={message}
          onChange={handleMessageInput}
          onBlur={handleBlur}
          aria-label="Message"
          style={{
            pointerEvents: "auto",
          }}
        />
        <input
          ref={emailInputRef}
          type="email"
          value={email}
          onChange={handleEmailInput}
          onBlur={handleBlur}
          aria-label="Email"
          style={{
            pointerEvents: "auto",
          }}
        />
        <input
          ref={subjectInputRef}
          type="text"
          value={subject}
          onChange={handleSubjectInput}
          onBlur={handleBlur}
          aria-label="Subject"
          style={{
            pointerEvents: "auto",
          }}
        />
      </Html>

      {}
      <mesh
        ref={paperRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handlePaperClick}
      >
        <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT, 20, 20]} />
        <meshBasicMaterial
          color="#e0e0e0"
          map={paperTexture}
          transparent
          alphaTest={0.5}
          side={THREE.FrontSide}
          roughness={0.9}
        />
      </mesh>

      {}
      <mesh ref={backPaperRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT, 20, 20]} />
        <meshBasicMaterial
          color="#f5f5f0"
          side={THREE.BackSide}
          roughness={0.9}
        />
      </mesh>

      {}
      <>
        <InteractiveTextField
          isActive={activeField === "email"}
          value={email}
          placeholder="email..."
          cursor={cursorVisible ? "|" : " "}
          onClick={() => {
            setActiveField("email");
            setTimeout(() => emailInputRef.current?.focus(), 10);
          }}
          position={[-0.5, 0.008, -0.61]}
          baseRotation={[-Math.PI / 2, 0, 0.02]}
          hitboxPosition={[0, 0.005, -0.61]}
          hitboxSize={[PAPER_WIDTH * 0.85, 0.08]}
          fontSize={0.05}
          maxWidth={PAPER_WIDTH * 0.8}
          fontPath={FONT_PATH}
        />

        {}
        <InteractiveTextField
          isActive={activeField === "subject"}
          value={subject}
          placeholder="subject..."
          cursor={cursorVisible ? "|" : " "}
          onClick={() => {
            setActiveField("subject");
            setTimeout(() => subjectInputRef.current?.focus(), 10);
          }}
          position={[-0.5, 0.008, -0.46]}
          baseRotation={[-Math.PI / 2, 0, 0.02]}
          hitboxPosition={[0, 0.005, -0.46]}
          hitboxSize={[PAPER_WIDTH * 0.85, 0.08]}
          fontSize={0.05}
          maxWidth={PAPER_WIDTH * 0.8}
          fontPath={FONT_PATH}
        />

        {}
        <InteractiveTextField
          isActive={activeField === "message"}
          value={formattedMessage}
          placeholder="message..."
          cursor={cursorVisible ? "|" : " "}
          onClick={() => {
            setActiveField("message");
            setTimeout(() => hiddenInputRef.current?.focus(), 10);
          }}
          position={[-0.46, 0.008, -0.3]}
          baseRotation={[-Math.PI / 2, 0, 0.02]}
          hitboxPosition={[0, 0.005, 0.1]}
          hitboxSize={[PAPER_WIDTH * 0.85, 0.55]}
          fontSize={0.045}
          maxWidth={PAPER_WIDTH * 0.75}
          fontPath={FONT_PATH}
          anchorY="top"
          textAlign="left"
          lineHeight={1.35}
        />

        {}
        <SmoothButton
          texture={buttonTexture}
          onClick={handleButtonClick}
          position={[0, 0.005, 0.68]}
          size={[0.5, 0.13]}
          text={isSubmitting ? "SENDING..." : "SEND"}
          fontPath={FONT_PATH}
        />

        {}
        {Object.keys(errors).length > 0 && (
          <Text
            position={[0, 0.01, 0.55]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.035}
            color="#cc3333"
            font={FONT_PATH}
            anchorX="center"
            anchorY="middle"
          >
            {errors.email ||
              errors.subject ||
              errors.message ||
              "Please fill all fields"}
          </Text>
        )}

        {}
        {submitStatus === "success" && (
          <Text
            position={[0, 0.02, 0.55]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.045}
            color="#22aa44"
            font={FONT_PATH}
            anchorX="center"
            anchorY="middle"
          >
            Message sent! ✓
          </Text>
        )}

        {}
        {submitStatus === "error" && (
          <Text
            position={[0, 0.02, 0.55]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.04}
            color="#cc3333"
            font={FONT_PATH}
            anchorX="center"
            anchorY="middle"
          >
            Failed to send. Try again.
          </Text>
        )}
      </>
    </group>
  );
};
export default MessagePaper;
