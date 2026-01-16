import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { capturedImage, registeredFaces, mode } = await req.json();

    if (!capturedImage) {
      throw new Error("No captured image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build registered faces info
    const registeredFacesInfo = registeredFaces && registeredFaces.length > 0
      ? registeredFaces.map((face: any, index: number) => 
          `Person ${index + 1}: ID="${face.id}", Name="${face.name}"`
        ).join("\n")
      : "No registered faces available";

    // Different prompts based on mode
    const systemPrompt = mode === "detect" 
      ? `You are a face detection system. Analyze the image and detect ALL visible human faces.

For each face detected, estimate its bounding box position as percentages of the image dimensions.
The bounding box should be: x (left edge %), y (top edge %), width %, height %.

Registered People:
${registeredFacesInfo}

For each detected face, try to match it against registered people if possible.

RESPOND WITH ONLY VALID JSON in this exact format:
{
  "faces": [
    {
      "id": "face_1",
      "boundingBox": { "x": 25, "y": 15, "width": 30, "height": 40 },
      "matchedPersonId": "uuid-or-null",
      "matchedPersonName": "Name or null",
      "confidence": 85,
      "isRegistered": true
    }
  ],
  "totalFaces": 1,
  "message": "1 face detected"
}`
      : `You are a face recognition system for access control. Analyze the captured image.

Registered Faces:
${registeredFacesInfo}

RESPOND WITH ONLY VALID JSON:
{
  "faceDetected": boolean,
  "matchFound": boolean,
  "matchedPersonId": string | null,
  "matchedPersonName": string | null,
  "confidence": number (0-100),
  "message": string
}`;

    console.log("Calling AI Gateway with mode:", mode || "recognize");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: mode === "detect" 
                  ? "Detect all faces in this image and provide bounding box coordinates as percentages."
                  : "Analyze this image for face recognition.",
              },
              {
                type: "image_url",
                image_url: { url: capturedImage },
              },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", faces: [], totalFaces: 0 }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required", faces: [], totalFaces: 0 }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data));

    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Response:", aiResponse);
      result = mode === "detect" 
        ? { faces: [], totalFaces: 0, message: "Unable to process image" }
        : { faceDetected: false, matchFound: false, matchedPersonId: null, matchedPersonName: null, confidence: 0, message: "Unable to process" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in face-recognition:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        faces: [],
        totalFaces: 0,
        message: "Error processing request",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
