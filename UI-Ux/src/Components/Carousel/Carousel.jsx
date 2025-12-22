import React, { useEffect, useState } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import './Carousel.css';
import { getBanners } from "../../Api/catalogApi";
import { buildAssetUrl } from "../../utils/imageUrl";

function AdaptiveHeight() {
  const settings = {
    className: "carousel-slider",
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: false,
    autoplay: true,
    speed: 800,
    autoplaySpeed: 5000,
    arrows: false,
    fade: true,
    cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
    appendDots: dots => (
      <div className="custom-dots">
        <ul> {dots} </ul>
      </div>
    ),
    customPaging: i => (
      <div className="custom-dot" />
    )
  };

  const fallbackSlides = [
    {
      image: '/b1.png',
      title: 'Street Anime Tee',
      subtitle: 'Graphic lineup',
      discount: 'New Drop',
      cta: 'Shop Now',
      link: '/products'
    },
    {
      image: '/ro.jpg',
      title: 'Rogue Ronin Tee',
      subtitle: 'Brush art print',
      discount: 'Limited',
      cta: 'Grab One',
      link: '/products'
    }
  ];

  const [slides, setSlides] = useState(fallbackSlides);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadBanners = async () => {
      try {
        const banners = await getBanners();
        if (!isMounted) return;

        const normalized = (banners || [])
          .filter(Boolean)
          .map((banner) => ({
            image: buildAssetUrl(banner.image) || banner.image,
            title: banner.title || 'Anime Drop',
            subtitle: banner.subtitle || '',
            discount: banner.badge || 'Featured',
            cta: banner.ctaText || 'Shop Now',
            link: banner.ctaLink || '/products'
          }))
          .filter((banner) => banner.image);

        setSlides(normalized.length ? normalized : fallbackSlides);
      } catch (error) {
        console.error('Failed to load banners', error);
        setSlides(fallbackSlides);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="carousel-wrapper">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div key={index} className="carousel-slide">
            <div className="carousel-content-wrapper">
              <img
                src={slide.image}
                alt={slide.title}
                className="carousel-image"
              />
              <div className="carousel-overlay">
                <div className="carousel-text-content">
                  <div className="carousel-badge">
                    <span className="discount-text">Discount</span>
                    <span className="discount-value">{slide.discount}</span>
                  </div>
                  <p className="carousel-subtitle">{slide.subtitle}</p>
                  <h1 className="carousel-title">{slide.title}</h1>
                  <Link to={slide.link}>
                    <button className="carousel-cta">
                      {slide.cta}
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default AdaptiveHeight;
