import { useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../../store/auth-context';
import {
  addDocument,
  getImageUrl,
  updatePost,
  uploadImage,
} from '../../firebaseActions';
import classes from './NewPost.module.css';

const NewPost = ({ edit, onFinishEditing }) => {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log('new post executed');

  useEffect(() => {
    console.log('effect working');
    if (edit && edit.image) setImage(edit.image);
    if (!edit) {
      setImage(null);
    }
    setFile(null);
  }, [edit]);

  const authCtx = useContext(AuthContext);
  const postRef = useRef();
  const fileInputRef = useRef();

  if (edit) {
    postRef.current.value = edit.text;
  }

  const fileSelectHandler = (event) => {
    const currentFile = event.target.files[0];

    if (event.target.files && currentFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setFile(currentFile);
      };
      reader.readAsDataURL(event.target.files[0]);
    } else {
      resetNewPost(true);
    }
  };

  const savePostHandler = async (isPrivate) => {
    const post = postRef.current.value;

    if (post.trim().length === 0) {
      alert('Post must not be empty');
      return;
    }

    setIsLoading(true);
    let collection = 'posts';
    let filePath;
    if (file) {
      filePath = `users/${authCtx.userId}/${collection}/${file.name}`;
    }

    if (edit) {
      if (edit.isPrivate) collection = 'private-posts';

      let newImageUrl;
      if (file) {
        await uploadImage(filePath, file);
        await getImageUrl(filePath, (url) => (newImageUrl = url));
      }

      await updatePost(
        `users/${authCtx.userId}/${collection}/${edit.id}`,
        post,
        !image ? image : file ? newImageUrl : null,
        edit.image_local,
        filePath
      );

      onFinishEditing();
    } else {
      if (isPrivate === true) collection = 'private-posts';

      let newImageUrl;
      if (file) {
        console.log('file uploaded');
        await uploadImage(filePath, file);
        await getImageUrl(filePath, (url) => (newImageUrl = url));
      }

      await addDocument(`users/${authCtx.userId}/${collection}`, {
        text: post,
        timestamp: new Date().getTime(),
        author: authCtx.username,
        likes: {
          counter: 0,
          users: [],
        },
        author_id: authCtx.userId,
        author_photo: authCtx.profilePicture ? authCtx.profilePicture : null,
        image: file ? newImageUrl : null,
        image_local: filePath ? filePath : null,
      });
    }

    resetNewPost();
    setIsLoading(false);
  };

  const cancelEditingHandler = () => {
    onFinishEditing();
    postRef.current.value = '';
  };

  const removeImageHandler = () => {
    if (edit) {
      setImage(false);
    } else {
      resetNewPost(true);
    }
  };

  const resetNewPost = async (onlyImage) => {
    setFile(null);
    setImage(null);
    fileInputRef.current.value = null;

    if (!onlyImage) {
      postRef.current.value = '';
    }
  };

  const btnClasses = isLoading ? `btn disabled` : 'btn';

  return (
    <div className={classes['new-post']}>
      {image && (
        <div className={classes['edit-img']}>
          <img src={image} alt='post' />
          <button onClick={removeImageHandler}>Remove image</button>
        </div>
      )}

      <textarea placeholder='What do you want to share?' ref={postRef} />

      <div className={classes.actions}>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={fileSelectHandler}
        />

        <div>
          <button
            className={btnClasses}
            onClick={savePostHandler}
            disabled={isLoading}
          >
            {edit ? 'Confirm edit' : 'Share'}
          </button>

          {!edit && (
            <button
              className={btnClasses}
              onClick={savePostHandler.bind(null, true)}
              disabled={isLoading}
            >
              Save as private
            </button>
          )}
          {edit && (
            <button
              className={btnClasses}
              onClick={cancelEditingHandler}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {isLoading && <span>Saving...</span>}
    </div>
  );
};

export default NewPost;
