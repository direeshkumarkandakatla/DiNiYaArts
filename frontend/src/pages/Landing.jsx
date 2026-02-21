import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import BrushIcon from '@mui/icons-material/Brush';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GroupsIcon from '@mui/icons-material/Groups';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InstagramIcon from '@mui/icons-material/Instagram';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFCFE' }}>
      {/* Navigation */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'grey.100',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0 } }}>
            <PaletteIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'primary.dark',
                flexGrow: 1,
                cursor: 'pointer',
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              DiNiYa Arts
            </Typography>

            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, mr: 2 }}>
              <Button color="inherit" sx={{ color: 'text.secondary' }} onClick={() => scrollToSection('about')}>
                About
              </Button>
              <Button color="inherit" sx={{ color: 'text.secondary' }} onClick={() => scrollToSection('painting')}>
                Art
              </Button>
              <Button color="inherit" sx={{ color: 'text.secondary' }} onClick={() => scrollToSection('contact')}>
                Contact
              </Button>
            </Box>

            {isAuthenticated ? (
              <Button variant="contained" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="contained" onClick={() => navigate('/register')}>
                  Join Us
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 14, md: 18 },
          pb: { xs: 10, md: 14 },
          background: 'linear-gradient(135deg, #E0F2F1 0%, #E8EAF6 50%, #F3E5F5 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'rgba(77, 182, 172, 0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            bgcolor: 'rgba(179, 157, 219, 0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            right: '15%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'rgba(129, 212, 250, 0.12)',
          }}
        />

        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: '#2C3E50',
              mb: 2,
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              lineHeight: 1.2,
            }}
          >
            Where Creativity
            <Box component="span" sx={{ color: 'primary.main' }}> Blossoms</Box>
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              mb: 4,
              fontWeight: 400,
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.4rem' },
              lineHeight: 1.6,
            }}
          >
            A nurturing space for children and adults to discover the joy of art,
            express their imagination, and grow through creativity.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => scrollToSection('painting')}
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              Explore Classes
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => scrollToSection('contact')}
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              Get in Touch
            </Button>
          </Box>
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#2C3E50',
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
              }}
            >
              About DiNiYa Arts
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 700,
                mx: 'auto',
                fontSize: '1.1rem',
                lineHeight: 1.8,
              }}
            >
              At DiNiYa Arts, we believe every child carries a universe of creativity within them.
              Our studio is a warm, welcoming space where young minds explore colors, shapes, and
              stories through art. We nurture not just skills, but confidence, patience, and
              the courage to express oneself freely.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: <FavoriteIcon sx={{ fontSize: 40 }} />,
                title: 'Our Passion',
                description:
                  'Art is more than painting on canvas — it\'s a language of the heart. We pour love into every class, creating moments that inspire and uplift.',
                color: '#FFCDD2',
                iconColor: '#E57373',
              },
              {
                icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
                title: 'Our Motive',
                description:
                  'To spark curiosity and imagination in every student. We guide young artists to see the world through creative eyes and find beauty in every brushstroke.',
                color: '#C8E6C9',
                iconColor: '#81C784',
              },
              {
                icon: <GroupsIcon sx={{ fontSize: 40 }} />,
                title: 'Our Community',
                description:
                  'A family of creative souls — parents, children, and instructors — all learning and growing together in a supportive, joyful environment.',
                color: '#BBDEFB',
                iconColor: '#64B5F6',
              },
            ].map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item.title}>
                <Card
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'grey.100',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        color: item.iconColor,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Painting Section */}
      <Box
        id="painting"
        sx={{
          py: { xs: 8, md: 12 },
          background: 'linear-gradient(180deg, #FAFCFE 0%, #F0F4F8 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BrushIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                <Typography
                  variant="overline"
                  sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, fontSize: '0.85rem' }}
                >
                  Art
                </Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: '#2C3E50',
                  mb: 3,
                  fontSize: { xs: '1.8rem', md: '2.4rem' },
                  lineHeight: 1.3,
                }}
              >
                Discover the Magic of
                <Box component="span" sx={{ color: 'secondary.main' }}> Colors</Box>
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 3, fontSize: '1.05rem' }}
              >
                Our art classes are designed to bring out the inner artist in every child.
                From watercolors to acrylics, from abstract splashes to detailed landscapes —
                each session is a new adventure in creativity. Students learn techniques at their
                own pace in a relaxed, encouraging atmosphere.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { icon: <ChildCareIcon />, text: 'Classes for all ages — toddlers to teens' },
                  { icon: <ColorLensIcon />, text: 'Watercolors, acrylics, mixed media & more' },
                  { icon: <GroupsIcon />, text: 'Small groups for personalized attention' },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              {/* Placeholder for photos/videos - styled attractively */}
              <Box
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: 4,
                  p: 4,
                  border: '2px dashed',
                  borderColor: 'grey.200',
                  textAlign: 'center',
                  minHeight: 350,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <PaletteIcon sx={{ fontSize: 64, color: 'grey.300' }} />
                <Typography variant="h6" sx={{ color: 'grey.400' }}>
                  Photos & Videos Coming Soon
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  Gallery of student artwork, class sessions, and creative moments
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box id="contact" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#2C3E50',
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
              }}
            >
              Get in Touch
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', fontSize: '1.1rem' }}
            >
              Have questions? Want to enroll your child? We'd love to hear from you!
            </Typography>
          </Box>

          <Grid container spacing={2} justifyContent="center">
            {[
              {
                icon: <EmailIcon sx={{ fontSize: 36 }} />,
                title: 'Email',
                detail: 'diniya.artsstudio@gmail.com',
                color: '#E8EAF6',
                iconColor: '#7986CB',
              },
              {
                icon: <PhoneIcon sx={{ fontSize: 36 }} />,
                title: 'Phone',
                detail: '+1 (425)-633-4589',
                color: '#E0F2F1',
                iconColor: '#4DB6AC',
              },
              {
                icon: <LocationOnIcon sx={{ fontSize: 36 }} />,
                title: 'Location',
                detail: '7320 132nd PL SE, Snohomish, WA 98296',
                href: 'https://www.google.com/maps/search/?api=1&query=7320+132nd+PL+SE%2C+Snohomish%2C+WA+98296',
                color: '#FFF3E0',
                iconColor: '#FFB74D',
              },
              {
                icon: <InstagramIcon sx={{ fontSize: 36 }} />,
                title: 'Instagram',
                detail: '@diniya.artsstudio',
                href: 'https://www.instagram.com/diniya.artsstudio/',
                color: '#FCE4EC',
                iconColor: '#E1306C',
              },
            ].map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
                <Card
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    border: '1px solid',
                    borderColor: 'grey.100',
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        color: item.iconColor,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {item.detail}
                        </a>
                      ) : (
                        item.detail
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              Ready to start your creative journey?
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ px: 5, py: 1.5, fontSize: '1rem' }}
            >
              Join DiNiYa Arts Today
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          bgcolor: '#2C3E50',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaletteIcon sx={{ color: 'primary.light' }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                DiNiYa Arts
              </Typography>
            </Box>
            <Typography variant="body2">
              {new Date().getFullYear()} DiNiYa Arts Studio. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
