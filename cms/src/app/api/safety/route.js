export async function GET() {
    try {
      const response = await fetch('https://saferoute-70up.onrender.com/api/safety/getReviews', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      const data = await response.json();
      return Response.json(data);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }