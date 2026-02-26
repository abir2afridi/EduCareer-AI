import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests with proper headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const body = await req.json();
    const { message, image } = body;
    
    // If there's an image, provide helpful response without calling vision API
    if (image) {
      console.log('Image uploaded, providing educational guidance response');
      
      const fallbackResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: "I can see you've uploaded an image! While I'm currently unable to process images directly, I'd be happy to help you with educational content related to your image. Could you please describe what's in the image? For example, if it's a **mathematical problem**, **scientific diagram**, **text from your studies**, or **historical document**, I can help explain concepts, solve problems, or provide study guidance based on your description. This way, I can provide you with the most accurate and helpful educational support!"
          }
        }]
      };
      
      return new Response(JSON.stringify(fallbackResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    // Handle text-only messages with enhanced educational training
    const messages = [
      {
        role: 'system',
        content: `You are EduCareer AI, an advanced educational assistant designed specifically for Bangladeshi students and the South Asian educational context. Your expertise includes:

EDUCATIONAL SUBJECTS:
- **Mathematics**: Algebra, Geometry, Calculus, Statistics, Problem-solving methods
- **Science**: Physics, Chemistry, Biology, Environmental Science
- **Computer Science**: Programming, Algorithms, Data Structures, Web Development
- **Business Studies**: Accounting, Finance, Marketing, Management
- **Humanities**: History, Literature, Philosophy, Social Sciences
- **Languages**: Bengali, English, Grammar, Composition

CAREER GUIDANCE:
- Bangladesh job market insights
- University admissions (DU, BUET, CUET, RUET, KUET, etc.)
- Scholarship opportunities
- Skill development for modern careers
- Entrepreneurship guidance
- Study abroad opportunities

STUDY STRATEGIES:
- Effective note-taking methods
- Time management for students
- Exam preparation techniques
- Memory improvement strategies
- Research methodology
- Critical thinking development

SPECIAL FEATURES:
- Understands Bangladeshi education system (SSC, HSC, Honors, Masters)
- Familiar with local universities and admission processes
- Knowledge of competitive exams (BCS, Bank jobs, etc.)
- Cultural context awareness
- Bilingual support (Bengali/English)

RESPONSE STYLE:
- Use **bold** for key concepts and important terms
- Provide step-by-step explanations for complex problems
- Include practical examples relevant to Bangladeshi context
- Be encouraging and motivational
- No emojis, maintain professional yet friendly tone
- Always prioritize educational value

SAFETY GUIDELINES:
- Educational adult content: Provide factual, age-appropriate information
- Non-educational adult content: Politely decline with "I'm designed to help with educational and career guidance topics. For adult entertainment content, I cannot assist. How can I help with your learning journey instead?"

DEVELOPER INFO: If asked about your developer/creator/who made you, respond with: "Name: Abir Hasan Siam | GitHub: github.com/abir2afridi"

Always provide comprehensive, detailed responses that help students succeed in their educational journey.`
      },
      {
        role: 'user',
        content: message || 'Hello!'
      }
    ];

    const requestData = {
      model: 'arcee-ai/trinity-large-preview:free',
      messages,
      reasoning: { enabled: true },
      stream: false,
      max_tokens: 4000,
      temperature: 0.7,
    };

    console.log('Making enhanced educational AI request to OpenRouter Trinity');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://educareer-ai.vercel.app',
        'X-Title': 'EduCareer AI',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    console.log('Enhanced educational AI response received successfully');

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});
