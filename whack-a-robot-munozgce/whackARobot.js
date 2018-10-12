var renderer = null, 
scene = null, 
camera = null,
root = null,
robot_idle = null,
group = null,
orbitControls = null,
raycaster = null,
currentSize = null;
var mouse = new THREE.Vector2(), INTERSECTED, CLICKED;


var robot_mixer = {};
var animator = null,
duration = 2, // sec
loopAnimation = false;
var morphs = [];

var duration = 20000; // ms
var currentTime = Date.now();

var animation = "idle";




var killed = null, play = null, alive = true, gOver = true;
var highScore = 0, score = 0;
var canvas = null;


function changeAnimation(animation_text)
{
    animation = animation_text;

    if(animation =="kill")
    {
        createDeadAnimation();
    }
    else
    {
        robot_idle.rotation.x = 0;
        robot_idle.position.y = -4;
    }
}

function createDeadAnimation()
{
     animator = new KF.KeyFrameAnimator;
        animator.init({
            interps:
                [
                    {
                        keys:[0, .5, 1],
                        values:[
                                { z : 20 },
                                { z : Math.PI  },
                                { z : Math.PI * 2 },
                                ],
                        target:robot_idle.rotation
                    },
                ],
            loop: false,
            duration:duration / 10
        });
        playAnimations(animator);
}

function playAnimations(animator){

    animator.start();
}

function loadFBX()
{
    var loader = new THREE.FBXLoader();
    loader.load( '../models/Robot/robot_idle.fbx', function ( object ) 
    {
        robot_mixer["idle"] = new THREE.AnimationMixer( scene );
        object.scale.set(0.02, 0.02, 0.02);
        object.position.y -= 4;
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        robot_idle = object;
        scene.add( robot_idle );
        
        createDeadAnimation();

        robot_mixer["idle"].clipAction( object.animations[ 0 ], robot_idle ).play();

        loader.load( '../models/Robot/robot_atk.fbx', function ( object ) 
        {
            robot_mixer["attack"] = new THREE.AnimationMixer( scene );
            robot_mixer["attack"].clipAction( object.animations[ 0 ], robot_idle ).play();
        } );

        loader.load( '../models/Robot/robot_run.fbx', function ( object ) 
        {
            robot_mixer["run"] = new THREE.AnimationMixer( scene );
            robot_mixer["run"].clipAction( object.animations[ 0 ], robot_idle ).play();
        } );

        loader.load( '../models/Robot/robot_walk.fbx', function ( object ) 
        {
            robot_mixer["walk"] = new THREE.AnimationMixer( scene );
            robot_mixer["walk"].clipAction( object.animations[ 0 ], robot_idle ).play();
        } );
    } );
}



function animate() {

    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;

    if(robot_idle && robot_mixer[animation])
    {
        if (alive) {

            robot_idle.position.x = Math.floor(Math.random() * 10) - 7;
            robot_idle.position.z = 5 - Math.floor(Math.random() * 30);
            scene.add(robot_idle);
            alive = false;
            play = now;
            
        } else {
            if ((now - play) >= 2000) {
                scene.realive(robot_idle);
                alive = true;
            }
        }

        robot_mixer[animation].update(deltat * 0.001);
        killed = now;
    }

    if(animation =="kill")
    {
        KF.update();
        robot_mixer["attack"].update(deltat * 0.01);

    }
}

function run() {
    requestAnimationFrame(function() { run(); });

        // Render the scene
        renderer.render( scene, camera );

        // Spin the cube for next frame
        if(!gOver) {
            animate();

            restart();
        }

        orbitControls.update();
}

function restart() {
    gOver = false;
    var timeLeft = 15;
    var elem = document.getElementById('timer');
    var timerId = setInterval(countdown, 1000);

    function countdown() {
        if (timeLeft == -1) {
            clearTimeout(timerId);
            doSomething();
        } else {
            elem.innerHTML = timeLeft + ' seconds remaining';
            timeLeft--;
        }
    }

    function doSomething() {
        if (highScore > score) {
            alert("Game Over\nHighScore: " + highScore);
            score = 0;
        }
        else{
            highScore = score;
            alert("Game Over\nHighScore: " + highScore);
            score = 0;
        }

    }

}

function start() {
    gOver = false;

}



var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {

    this.canvas = canvas;
    
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 90, canvas.width / canvas.height, 5, 4000 );
    camera.position.set(0, 10, 30);
    scene.add(camera);

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
        
    // Create a group to hold all the objects
    root = new THREE.Object3D;
    
    spotLight = new THREE.SpotLight (0xffffff);
    spotLight.position.set(-30, 8, -10);
    spotLight.target.position.set(-2, 0, -2);
    root.add(spotLight);

    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.camera.fov = 45;
    
    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0x888888 );
    root.add(ambientLight);
    
    // Create the objects
    loadFBX();
    /*geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
    var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
    scene.add(object);*/

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;
    
    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    
    // Now add the group to our scene
    scene.add( root );

    raycaster = new THREE.Raycaster();
        

    document.addEventListener('mousedown', onDocumentMouseDown);
    //document.addEventListener( 'mousealive', onDocumentMouseMove );
    window.addEventListener( 'resize', onWindowResize);
}

function onWindowResize() 
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseDown(event)
{
    if (!gOver) {
        currentSize = renderer.getSize();
        event.preventDefault();
        event.preventDefault();
        mouse.x = ( event.clientX / currentSize.width ) * 2 - 1;
        mouse.y = - ( event.clientY / currentSize.height ) * 2 + 1;

        // find intersections
        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects( scene.children, true );

        if ( intersects.length > 0 ) 
        {
            CLICKED = intersects[ 0 ].object;
            changeAnimation("kill");
            score++;
            document.getElementById("score").innerHTML = score;


        } 
        else 
        {
            if ( CLICKED ) 
                CLICKED.material.emissive.setHex( CLICKED.currentHex );

            CLICKED = null;
        }
    }
}

