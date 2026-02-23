import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Scene3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    

    // --- SETUP ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    // Use a slight fog to blend the object into the background distance
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.05);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- OBJECTS ---
    
    // Group to hold the "Focus Crystal"
    const group = new THREE.Group();
    scene.add(group);

    // 1. Core Icosahedron (Solid)
    const geometryCore = new THREE.IcosahedronGeometry(1.5, 0);
    const materialCore = new THREE.MeshPhongMaterial({ 
      color: 0x0ea5e9, // brand-500
      flatShading: true,
      shininess: 10,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(geometryCore, materialCore);
    group.add(core);

    // 2. Wireframe Cage
    const geometryWire = new THREE.IcosahedronGeometry(2.2, 1);
    const materialWire = new THREE.MeshBasicMaterial({ 
      color: 0x0284c7, // brand-600
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wire = new THREE.Mesh(geometryWire, materialWire);
    group.add(wire);

    // 3. Floating Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const posArray = new Float32Array(particleCount * 3);

    for(let i = 0; i < particleCount * 3; i++) {
        // Random positions around the center
        posArray[i] = (Math.random() - 0.5) * 15; 
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.5
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const blueLight = new THREE.PointLight(0x0ea5e9, 2, 10);
    blueLight.position.set(-2, -2, 2);
    scene.add(blueLight);


    // --- ANIMATION LOOP ---
    let scrollY = window.scrollY;
    
    const handleScroll = () => {
        scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    const animate = () => {
      requestAnimationFrame(animate);

      // Idle Rotation
      core.rotation.x += 0.001;
      core.rotation.y += 0.002;
      wire.rotation.x -= 0.001;
      wire.rotation.y -= 0.002;
      particlesMesh.rotation.y += 0.0005;

      // Scroll Interaction
      // Rotate based on scroll depth
      const targetRotation = scrollY * 0.002;
      
      group.rotation.y = targetRotation;
      group.rotation.z = scrollY * 0.001;

      // Parallax / Movement effect on scroll
      // Move camera slightly down as we scroll down
      camera.position.y = -(scrollY * 0.003);
      
      // Push the object slightly away and to the side as we scroll
      // This makes it feel like we are passing it by
      group.position.x = Math.sin(scrollY * 0.001) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
        if (!mountRef.current) return;
        const newWidth = mountRef.current.clientWidth;
        const newHeight = mountRef.current.clientHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- CLEANUP ---
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose resources to prevent memory leaks
      geometryCore.dispose();
      materialCore.dispose();
      geometryWire.dispose();
      materialWire.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
};